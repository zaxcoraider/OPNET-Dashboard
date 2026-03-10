import { rpc, hexToNumber } from './opnetRpc';

export type AddressType = 'btc-mainnet' | 'opnet-testnet' | 'unknown';

export interface TxRecord {
  txid: string;
  shortHash: string;
  type: 'Receive' | 'Send' | 'Interaction' | 'Unknown';
  amountSats: number;
  amountDisplay: string;
  counterparty: string;
  date: string;
  feeSats: number;
  feeDisplay: string;
  status: 'Confirmed' | 'Pending';
  blockHeight?: number;
}

export interface AddressData {
  address: string;
  addressType: AddressType;
  balanceSats: number;
  balanceBTC: string;
  txCount: number;
  utxoCount: number;
  firstSeen: string | null;
  isOpNetEnabled: boolean;
  transactions: TxRecord[];
  /** Hex contract addresses (0x...) discovered from this address's tx history */
  rawContracts: string[];
}

/** Detect whether this is a BTC mainnet or OPNet testnet address */
export function detectAddressType(address: string): AddressType {
  const addr = address.trim();
  if (/^bc1/.test(addr) || /^[13][a-zA-Z0-9]{24,33}$/.test(addr)) return 'btc-mainnet';
  if (/^opt1/.test(addr) || /^tb1/.test(addr)) return 'opnet-testnet';
  return 'unknown';
}

/* ── Internal types for mempool.space API ── */

interface MempoolAddress {
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

interface MempoolTx {
  txid: string;
  fee?: number;
  status?: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
  vin?: Array<{
    prevout?: {
      scriptpubkey_address?: string;
      value?: number;
    };
  }>;
  vout?: Array<{
    scriptpubkey_address?: string;
    value?: number;
  }>;
}

interface OPNetPendingTx {
  id: string;
  firstSeen: string;
  blockHeight: string;
  transactionType: string;
  from: string | null;
  contractAddress: string | null;
  outputs: Array<{ address: string; value: string }>;
}

/* ── Helpers ── */

function shortenAddr(addr: string): string {
  if (!addr || addr.length <= 16) return addr;
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

function parseMempoolTx(tx: MempoolTx, address: string): TxRecord {
  const voutToUs = (tx.vout ?? []).reduce((sum, v) =>
    v.scriptpubkey_address === address ? sum + (v.value ?? 0) : sum, 0);
  const vinFromUs = (tx.vin ?? []).reduce((sum, v) =>
    v.prevout?.scriptpubkey_address === address ? sum + (v.prevout.value ?? 0) : sum, 0);

  const netValue = voutToUs - vinFromUs;
  const fee = tx.fee ?? 0;
  const confirmed = tx.status?.confirmed ?? false;

  let counterparty = 'Unknown';
  if (netValue >= 0) {
    counterparty = tx.vin?.[0]?.prevout?.scriptpubkey_address ?? 'Coinbase';
  } else {
    counterparty =
      tx.vout?.find(v => v.scriptpubkey_address && v.scriptpubkey_address !== address)
        ?.scriptpubkey_address ?? 'Unknown';
  }

  const dateStr = tx.status?.block_time
    ? new Date(tx.status.block_time * 1000).toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Pending';

  const btcAmt = Math.abs(netValue) / 1e8;

  return {
    txid: tx.txid,
    shortHash: tx.txid.slice(0, 8) + '...' + tx.txid.slice(-6),
    type: netValue >= 0 ? 'Receive' : 'Send',
    amountSats: netValue,
    amountDisplay: netValue >= 0 ? `+${btcAmt.toFixed(6)} BTC` : `-${btcAmt.toFixed(6)} BTC`,
    counterparty: shortenAddr(counterparty),
    date: dateStr,
    feeSats: fee,
    feeDisplay: `${(fee / 1e8).toFixed(6)} BTC`,
    status: confirmed ? 'Confirmed' : 'Pending',
    blockHeight: tx.status?.block_height,
  };
}

/* ── BTC Mainnet (mempool.space) ── */

export async function fetchBtcMainnetData(address: string): Promise<AddressData> {
  const BASE = 'https://mempool.space/api';

  const [addrRes, txsRes, opnetRes] = await Promise.allSettled([
    fetch(`${BASE}/address/${address}`),
    fetch(`${BASE}/address/${address}/txs`),
    rpc<string>('btc-mainnet', 'btc_getBalance', [address]),
  ]);

  if (addrRes.status === 'rejected') throw new Error('Network request failed. Check your connection.');
  const addrResp = addrRes.value;
  if (!addrResp.ok) {
    if (addrResp.status === 400) throw new Error('Invalid Bitcoin address format.');
    throw new Error(`Address lookup failed (HTTP ${addrResp.status})`);
  }

  const addrData: MempoolAddress = await addrResp.json();
  const txsData: MempoolTx[] =
    txsRes.status === 'fulfilled' && txsRes.value.ok ? await txsRes.value.json() : [];

  const cs = addrData.chain_stats;
  const ms = addrData.mempool_stats;

  const confirmedBal = cs.funded_txo_sum - cs.spent_txo_sum;
  const pendingBal   = ms.funded_txo_sum - ms.spent_txo_sum;
  const totalBal     = confirmedBal + pendingBal;
  const txCount      = cs.tx_count + ms.tx_count;
  const utxoCount    = Math.max(0,
    (cs.funded_txo_count - cs.spent_txo_count) +
    (ms.funded_txo_count - ms.spent_txo_count),
  );

  const transactions = txsData.slice(0, 20).map(tx => parseMempoolTx(tx, address));

  const oldestTx = txsData[txsData.length - 1];
  const firstSeen = oldestTx?.status?.block_time
    ? new Date(oldestTx.status.block_time * 1000).toLocaleDateString('en-US', {
        month: 'short', year: 'numeric',
      })
    : null;

  let isOpNetEnabled = false;
  if (opnetRes.status === 'fulfilled') {
    try {
      isOpNetEnabled = hexToNumber(opnetRes.value as string) > 0;
    } catch { /* ignore */ }
  }

  return {
    address,
    addressType: 'btc-mainnet',
    balanceSats: totalBal,
    balanceBTC: (totalBal / 1e8).toFixed(8),
    txCount,
    utxoCount,
    firstSeen,
    isOpNetEnabled,
    transactions,
    rawContracts: [],
  };
}

/* ── OPNet Testnet ── */

export async function fetchOpNetTestnetData(address: string): Promise<AddressData> {
  const [balRes, pendRes] = await Promise.allSettled([
    rpc<string>('opnet-testnet', 'btc_getBalance', [address]),
    rpc<unknown>('opnet-testnet', 'btc_getLatestPendingTransactions', [{ address, limit: 20 }]),
  ]);

  let balanceSats = 0;
  if (balRes.status === 'fulfilled') {
    try { balanceSats = hexToNumber(balRes.value as string); } catch { /* ignore */ }
  }

  let transactions: TxRecord[] = [];
  let txCount = 0;
  const rawContracts: string[] = [];

  if (pendRes.status === 'fulfilled') {
    const raw = pendRes.value as { transactions?: OPNetPendingTx[] };
    const list: OPNetPendingTx[] = raw?.transactions ?? [];
    txCount = list.length;

    // Collect unique contract addresses for token/NFT lookup
    const seen = new Set<string>();
    for (const tx of list) {
      if (tx.contractAddress && !seen.has(tx.contractAddress)) {
        seen.add(tx.contractAddress);
        rawContracts.push(tx.contractAddress);
      }
    }

    transactions = list.map(tx => {
      const blockHeight = parseInt(tx.blockHeight, 16);
      const date = tx.firstSeen
        ? new Date(tx.firstSeen).toLocaleString('en-US', {
            month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
          })
        : 'Unknown';

      const receivedSats = (tx.outputs ?? []).reduce((sum, out) =>
        out.address === address ? sum + parseInt(out.value, 10) : sum, 0);

      const isFromUs = tx.from === address;
      const type: TxRecord['type'] =
        tx.transactionType === 'Interaction' ? 'Interaction'
        : isFromUs ? 'Send'
        : 'Receive';

      const counterparty = isFromUs
        ? (tx.contractAddress || tx.outputs?.[0]?.address || 'Unknown')
        : (tx.from ?? 'Unknown');

      const amountSats = isFromUs ? 0 : receivedSats;
      const btcAmt = amountSats / 1e8;

      return {
        txid: tx.id,
        shortHash: tx.id.slice(0, 8) + '...' + tx.id.slice(-6),
        type,
        amountSats,
        amountDisplay: `+${btcAmt.toFixed(6)} BTC`,
        counterparty: shortenAddr(counterparty),
        date,
        feeSats: 0,
        feeDisplay: 'N/A',
        status: 'Pending' as const,
        blockHeight,
      };
    });
  }

  return {
    address,
    addressType: 'opnet-testnet',
    balanceSats,
    balanceBTC: (balanceSats / 1e8).toFixed(8),
    txCount,
    utxoCount: 0,
    firstSeen: null,
    isOpNetEnabled: true,
    transactions,
    rawContracts,
  };
}

/* ── Entry point ── */

export async function fetchAddressData(address: string): Promise<AddressData> {
  const type = detectAddressType(address.trim());
  if (type === 'btc-mainnet')    return fetchBtcMainnetData(address.trim());
  if (type === 'opnet-testnet')  return fetchOpNetTestnetData(address.trim());
  throw new Error(
    'Unrecognized address. Supported formats:\n• Bitcoin mainnet: bc1q…, bc1p…, 1…, 3…\n• OPNet testnet: opt1…',
  );
}
