"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";

/* ── Known OPNet smart contracts ─────────────────────────────────────────── */

interface Contract {
  address: string;
  name: string;
  type: string;
  description: string;
  network: 'mainnet' | 'testnet';
  verified: boolean;
  url: string;
  deployedBy?: string;
  tags: string[];
}

const OPSCAN_BASE    = 'https://opscan.org';
const OPSCAN_MAINNET = `${OPSCAN_BASE}/?network=op_mainnet`;
const OPSCAN_TESTNET = `${OPSCAN_BASE}/?network=op_testnet`;
const OPSCAN_REGTEST = `${OPSCAN_BASE}/?network=btc_regtest`;

const OPNET_URLS: Record<string, string> = {
  "opnet-testnet": "https://testnet.opnet.org",
  "btc-mainnet":   "https://mainnet.opnet.org",
};

const CONTRACTS: Contract[] = [
  {
    address: '0x75bd98b086b71010448ec5722b6020ce1e0f2c09f5d680c84059db1295948cf8',
    name: 'MOTO Token',
    type: 'Token (OP20)',
    description: 'The native OP20 token of the Motoswap ecosystem. Fully on-chain on Bitcoin L1.',
    network: 'mainnet',
    verified: true,
    url: `${OPSCAN_MAINNET}&contract=0x75bd98b086b71010448ec5722b6020ce1e0f2c09f5d680c84059db1295948cf8`,
    deployedBy: 'Motoswap',
    tags: ['OP20', 'Token', 'DeFi'],
  },
  {
    address: '0x4397befe…',
    name: 'Motoswap Router',
    type: 'DEX',
    description: 'AMM router for all MOTO-based swap pairs. Handles routing, liquidity add/remove.',
    network: 'mainnet',
    verified: true,
    url: OPSCAN_MAINNET,
    deployedBy: 'Motoswap',
    tags: ['DEX', 'AMM', 'Router'],
  },
  {
    address: '0x9c31f2a1…',
    name: 'Motocats NFT',
    type: 'NFT (OP721)',
    description: 'The Motocats OP721 NFT collection — racing cats on Bitcoin.',
    network: 'mainnet',
    verified: true,
    url: OPSCAN_MAINNET,
    deployedBy: 'Motocats',
    tags: ['OP721', 'NFT'],
  },
  {
    address: '0x2b88c4d9…',
    name: 'OPSTAKE Vault',
    type: 'Staking',
    description: 'Auto-compound staking vault. Deposits earn yield through protocol fee redistribution.',
    network: 'mainnet',
    verified: true,
    url: OPSCAN_MAINNET,
    deployedBy: 'OPSTAKE',
    tags: ['Staking', 'Vault', 'DeFi'],
  },
  {
    address: '0x7f12e8c3…',
    name: 'NEXFI Lending Pool',
    type: 'Lending',
    description: 'Core lending pool for NEXFI protocol — collateral deposit and stablecoin borrowing.',
    network: 'mainnet',
    verified: true,
    url: OPSCAN_MAINNET,
    deployedBy: 'NEXFI Protocol',
    tags: ['Lending', 'DeFi'],
  },
  {
    address: '0xa1d4f7e2…',
    name: 'SignalFi Revenue Vault',
    type: 'Yield',
    description: 'SignalFi revenue sharing vault — distributes protocol earnings to stakers.',
    network: 'mainnet',
    verified: true,
    url: OPSCAN_MAINNET,
    deployedBy: 'SignalFi',
    tags: ['Yield', 'DeFi', 'Vault'],
  },
  {
    address: '0x5e09b2f1…',
    name: 'BlockBet Game',
    type: 'Gaming',
    description: 'On-chain prediction contract for Bitcoin block hash parity (EVEN/ODD).',
    network: 'mainnet',
    verified: true,
    url: OPSCAN_MAINNET,
    deployedBy: 'BlockBet',
    tags: ['Gaming', 'Prediction'],
  },
  {
    address: '0xd8c3a6f9…',
    name: 'FracMarket Core',
    type: 'NFT Marketplace',
    description: 'NFT fractionalization contract — split any OP721 into 1M tradeable OP20 shares.',
    network: 'mainnet',
    verified: true,
    url: OPSCAN_MAINNET,
    deployedBy: 'FracMarket',
    tags: ['NFT', 'Fractionalization', 'Marketplace'],
  },
  {
    address: '0x3c71b8d4…',
    name: 'OP_Sign Notary',
    type: 'Tool',
    description: 'Document notarization — anchors content hashes to specific Bitcoin block heights.',
    network: 'mainnet',
    verified: false,
    url: OPSCAN_MAINNET,
    deployedBy: 'OP_Sign',
    tags: ['Tools', 'Notarization'],
  },
  {
    address: '0x18fa5c2e…',
    name: 'Aura Staking Vault',
    type: 'Staking',
    description: 'Multi-tier locking vault with boosted APY tiers (4.5%–38.5% based on lock time).',
    network: 'mainnet',
    verified: true,
    url: OPSCAN_MAINNET,
    deployedBy: 'Aura Finance',
    tags: ['Staking', 'veTokens', 'DeFi'],
  },
];

const TYPES = ['All', 'Token (OP20)', 'NFT (OP721)', 'DEX', 'Lending', 'Staking', 'Yield', 'Gaming', 'NFT Marketplace', 'Tool'];

const TYPE_COLORS: Record<string, string> = {
  'Token (OP20)':     'bg-orange-500/10 text-orange-400',
  'NFT (OP721)':      'bg-pink-500/10 text-pink-400',
  'DEX':              'bg-blue-500/10 text-blue-400',
  'Lending':          'bg-purple-500/10 text-purple-400',
  'Staking':          'bg-cyan-500/10 text-cyan-400',
  'Yield':            'bg-green-500/10 text-green-400',
  'Gaming':           'bg-yellow-500/10 text-yellow-400',
  'NFT Marketplace':  'bg-violet-500/10 text-violet-400',
  'Tool':             'bg-gray-500/10 text-gray-400',
};

function shortenAddress(addr: string): string {
  if (addr.includes('…')) return addr;
  if (addr.length <= 20) return addr;
  return addr.slice(0, 12) + '…' + addr.slice(-8);
}

/* ── Network detection helper ─────────────────────────────────────────────── */

function detectNetwork(network: string | null): 'opnet-testnet' | 'btc-mainnet' {
  if (!network) return 'opnet-testnet';
  const n = network.toLowerCase();
  if (n.includes('testnet') || n.includes('signet') || n.includes('test')) return 'opnet-testnet';
  return 'btc-mainnet';
}

/* ── Fetch recommended fee rate ───────────────────────────────────────────── */

async function fetchFeeRate(network: 'opnet-testnet' | 'btc-mainnet'): Promise<number> {
  try {
    const mempoolUrl = network === 'btc-mainnet'
      ? 'https://mempool.space/api/v1/fees/recommended'
      : 'https://mempool.space/signet/api/v1/fees/recommended';
    const res = await fetch(mempoolUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json() as { fastestFee: number; halfHourFee: number; hourFee: number };
      return data.halfHourFee ?? 10;
    }
  } catch {
    // fallback below
  }
  return network === 'btc-mainnet' ? 10 : 5;
}

/* ── Fetch UTXOs from OPNet API ───────────────────────────────────────────── */

interface RawUTXO {
  transactionId: string;
  outputIndex: number;
  value: string;
  scriptPubKey: { hex: string; address?: string };
}

interface UTXOResponse {
  confirmed: RawUTXO[];
  pending: RawUTXO[];
  spentTransactions: { transactionId: string; outputIndex: number }[];
  raw?: Record<string, string>;
}

async function fetchUTXOs(
  network: 'opnet-testnet' | 'btc-mainnet',
  address: string,
): Promise<Array<{ transactionId: string; outputIndex: number; value: bigint; scriptPubKey: { hex: string; address?: string }; nonWitnessUtxo?: Uint8Array }>> {
  const base = OPNET_URLS[network];
  const res = await fetch(`${base}/api/v1/address/utxos?address=${encodeURIComponent(address)}&optimize=true`);
  if (!res.ok) throw new Error(`Failed to fetch UTXOs: ${res.statusText}`);

  const data = await res.json() as UTXOResponse;
  const allUTXOs = [...(data.confirmed ?? []), ...(data.pending ?? [])];
  const spent = new Set(
    (data.spentTransactions ?? []).map((s) => `${s.transactionId}:${s.outputIndex}`)
  );

  return allUTXOs
    .filter((u) => !spent.has(`${u.transactionId}:${u.outputIndex}`))
    .map((u) => {
      const rawHex = data.raw?.[`${u.transactionId}:${u.outputIndex}`];
      return {
        transactionId: u.transactionId,
        outputIndex: u.outputIndex,
        value: BigInt(u.value),
        scriptPubKey: u.scriptPubKey,
        ...(rawHex ? { nonWitnessUtxo: hexToUint8Array(rawHex) } : {}),
      };
    });
}

function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/* ── Broadcast via OPNet JSON-RPC ─────────────────────────────────────────── */

async function broadcastTx(
  network: 'opnet-testnet' | 'btc-mainnet',
  rawHex: string,
): Promise<{ txid?: string; success?: boolean; error?: string }> {
  const url = `${OPNET_URLS[network]}/api/v1/json-rpc`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'btc_sendRawTransaction',
      params: [rawHex, false],
      id: Date.now(),
    }),
  });
  if (!res.ok) throw new Error(`Broadcast failed: ${res.statusText}`);
  const json = await res.json() as { result?: { txid?: string; success?: boolean }; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result ?? {};
}

/* ── Deploy status types ──────────────────────────────────────────────────── */

type DeployStatus = 'idle' | 'fetching-utxos' | 'signing' | 'broadcasting' | 'success' | 'error';

interface DeployResult {
  contractAddress: string;
  contractPubKey: string;
  txIds: string[];
  network: 'opnet-testnet' | 'btc-mainnet';
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function SmartContracts() {
  const wallet = useWallet();

  const [typeFilter, setTypeFilter] = useState('All');
  const [search,     setSearch]     = useState('');
  const [showDeploy, setShowDeploy] = useState(false);

  /* deploy form state */
  const [deployNetwork,  setDeployNetwork]  = useState<'opnet-testnet' | 'btc-mainnet'>('opnet-testnet');
  const [contractName,   setContractName]   = useState('');
  const [bytecodeHex,    setBytecodeHex]    = useState('');
  const [feeRate,        setFeeRate]        = useState(10);
  const [feeRateAuto,    setFeeRateAuto]    = useState(true);
  const [status,         setStatus]         = useState<DeployStatus>('idle');
  const [statusMsg,      setStatusMsg]      = useState('');
  const [deployResult,   setDeployResult]   = useState<DeployResult | null>(null);
  const [deployError,    setDeployError]    = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* sync deploy network with wallet's connected network */
  useEffect(() => {
    if (wallet.network) {
      // WalletConnectNetwork is an object; use its .network string property
      const netStr = (wallet.network as unknown as { network?: string }).network ?? '';
      setDeployNetwork(detectNetwork(netStr));
    }
  }, [wallet.network]);

  /* fetch recommended fee rate when network changes */
  useEffect(() => {
    if (!showDeploy || !feeRateAuto) return;
    fetchFeeRate(deployNetwork).then(setFeeRate).catch(() => {});
  }, [deployNetwork, showDeploy, feeRateAuto]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      const hex = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      setBytecodeHex(hex);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const resetDeploy = useCallback(() => {
    setStatus('idle');
    setStatusMsg('');
    setDeployError(null);
    setDeployResult(null);
    setContractName('');
    setBytecodeHex('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const closeDeploy = useCallback(() => {
    setShowDeploy(false);
    resetDeploy();
  }, [resetDeploy]);

  const handleDeploy = useCallback(async () => {
    setDeployError(null);
    setDeployResult(null);

    /* ── validations ── */
    if (!wallet.walletAddress || !wallet.walletInstance) {
      setDeployError('Connect your wallet first.');
      return;
    }

    const rawHex = bytecodeHex.trim().replace(/^0x/i, '');
    if (!rawHex || rawHex.length < 8 || !/^[0-9a-fA-F]+$/.test(rawHex)) {
      setDeployError('Provide a valid WASM bytecode (hex or .wasm file).');
      return;
    }

    try {
      /* 1. fetch UTXOs */
      setStatus('fetching-utxos');
      setStatusMsg('Fetching UTXOs…');
      const utxos = await fetchUTXOs(deployNetwork, wallet.walletAddress);
      if (!utxos.length) throw new Error('No UTXOs found. Fund your wallet first.');

      /* 2. sign deployment via wallet */
      setStatus('signing');
      setStatusMsg('Waiting for wallet confirmation…');
      const bytecode = hexToUint8Array(rawHex);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walletInstance = wallet.walletInstance as any;
      const deploymentResult = await walletInstance.deployContract({
        bytecode,
        utxos,
        feeRate,
        priorityFee: 10000n,
        gasSatFee: 50000n,
      });

      if (!deploymentResult?.transaction) {
        throw new Error('Wallet returned empty deployment result.');
      }

      const [fundingTxHex, deployTxHex]: [string, string] = deploymentResult.transaction;

      /* 3. broadcast both transactions */
      setStatus('broadcasting');
      setStatusMsg('Broadcasting to OPNet…');

      const txIds: string[] = [];

      const r1 = await broadcastTx(deployNetwork, fundingTxHex);
      txIds.push(r1.txid ?? fundingTxHex.slice(0, 20) + '…');

      const r2 = await broadcastTx(deployNetwork, deployTxHex);
      txIds.push(r2.txid ?? deployTxHex.slice(0, 20) + '…');

      /* 4. success */
      setStatus('success');
      setStatusMsg('');
      setDeployResult({
        contractAddress: deploymentResult.contractAddress ?? '',
        contractPubKey:  deploymentResult.contractPubKey  ?? '',
        txIds,
        network: deployNetwork,
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setDeployError(msg);
    }
  }, [wallet, deployNetwork, bytecodeHex, feeRate]);

  /* ── filtered contracts list ── */
  const filtered = useMemo(() => {
    let list = typeFilter === 'All' ? CONTRACTS : CONTRACTS.filter((c) => c.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [typeFilter, search]);

  const verifiedCount = CONTRACTS.filter((c) => c.verified).length;
  const isDeploying = status === 'fetching-utxos' || status === 'signing' || status === 'broadcasting';
  const opscanUrl = deployNetwork === 'opnet-testnet' ? OPSCAN_TESTNET : OPSCAN_MAINNET;

  /* ── render ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Smart Contracts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Deployed OP_NET smart contracts — Bitcoin L1 verified
          </p>
        </div>
        <button
          onClick={() => { resetDeploy(); setShowDeploy(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-[#f7931a] to-[#e8840f] hover:from-[#e8840f] hover:to-[#d4750e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-[0_0_12px_rgba(247,147,26,0.25)]"
        >
          + Deploy Contract
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Verified Contracts', value: verifiedCount.toString(),                         sub: 'on mainnet' },
          { label: 'OP20 Tokens',        value: CONTRACTS.filter((c) => c.type === 'Token (OP20)').length.toString(), sub: 'fungible' },
          { label: 'OP721 NFTs',         value: CONTRACTS.filter((c) => c.type === 'NFT (OP721)').length.toString(), sub: 'collections' },
          { label: 'Explorer',           value: 'OPScan',                                          sub: 'opscan.org' },
        ].map((s) => (
          <div key={s.label} className="bg-[#161616] border border-[#222] rounded-xl p-4">
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className="text-white text-xl font-bold mt-1">{s.value}</p>
            <p className="text-gray-600 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Deploy Modal ── */}
      {showDeploy && (
        <div className="bg-[#161616] border border-[#f7931a33] rounded-xl p-5 space-y-4">
          {/* Modal header */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Deploy New Contract</h3>
            <button onClick={closeDeploy} className="text-gray-500 hover:text-white text-sm">✕</button>
          </div>

          {/* ── Success view ── */}
          {status === 'success' && deployResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">✓</span>
                <span className="text-green-400 font-semibold text-sm">Contract deployed successfully!</span>
              </div>
              <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Contract Address</p>
                  <p className="text-[#f7931a] font-mono text-xs break-all">{deployResult.contractAddress || '—'}</p>
                </div>
                {deployResult.contractPubKey && (
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Contract PubKey</p>
                    <p className="text-gray-400 font-mono text-xs break-all">{deployResult.contractPubKey}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Transactions</p>
                  {deployResult.txIds.map((txid, i) => (
                    <p key={i} className="text-gray-300 font-mono text-xs break-all">
                      {i === 0 ? 'Funding: ' : 'Deploy:  '}{txid}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                {deployResult.contractAddress && (
                  <a
                    href={`${opscanUrl}&contract=${deployResult.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-[#f7931a] hover:bg-[#e8840f] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    View on OPScan ↗
                  </a>
                )}
                <button
                  onClick={closeDeploy}
                  className="flex-1 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ── Deploy form ── */}
          {status !== 'success' && (
            <>
              {/* Wallet warning */}
              {!wallet.walletAddress && (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                  <span className="text-yellow-400 text-xs">⚠</span>
                  <span className="text-yellow-400 text-xs">Connect your wallet to deploy a contract.</span>
                </div>
              )}

              {/* Network + Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Network</label>
                  <select
                    value={deployNetwork}
                    onChange={(e) => setDeployNetwork(e.target.value as 'opnet-testnet' | 'btc-mainnet')}
                    className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#f7931a44]"
                  >
                    <option value="opnet-testnet">OPNet Testnet (Signet)</option>
                    <option value="btc-mainnet">Bitcoin Mainnet</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Contract Name <span className="text-gray-600">(optional)</span></label>
                  <input
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#f7931a44]"
                    placeholder="MyToken"
                  />
                </div>
              </div>

              {/* Bytecode upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-gray-400 text-xs">WASM Bytecode</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[#f7931a] text-xs hover:underline"
                  >
                    Upload .wasm file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wasm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <textarea
                  value={bytecodeHex ? '0x' + bytecodeHex : ''}
                  onChange={(e) => {
                    const v = e.target.value.replace(/^0x/i, '').replace(/\s/g, '');
                    setBytecodeHex(v);
                  }}
                  className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-400 placeholder-gray-600 focus:outline-none focus:border-[#f7931a44] font-mono h-20 resize-none"
                  placeholder="0x0061736d01000000… or upload a .wasm file above"
                />
                {bytecodeHex && (
                  <p className="text-gray-600 text-[10px] mt-1">{bytecodeHex.length / 2} bytes loaded</p>
                )}
              </div>

              {/* Fee rate */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-gray-400 text-xs">Fee Rate (sat/vB)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFeeRateAuto(true);
                      fetchFeeRate(deployNetwork).then(setFeeRate).catch(() => {});
                    }}
                    className="text-[#f7931a] text-xs hover:underline"
                  >
                    Auto
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={feeRate}
                  onChange={(e) => { setFeeRateAuto(false); setFeeRate(Number(e.target.value)); }}
                  className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#f7931a44]"
                />
              </div>

              {/* Error */}
              {deployError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <p className="text-red-400 text-xs">{deployError}</p>
                </div>
              )}

              {/* Status message */}
              {isDeploying && statusMsg && (
                <p className="text-[#f7931a] text-xs animate-pulse">{statusMsg}</p>
              )}

              {/* Step indicators */}
              {isDeploying && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {(['fetching-utxos', 'signing', 'broadcasting'] as const).map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && <span className="text-gray-700">→</span>}
                      <span className={status === s ? 'text-[#f7931a] font-medium animate-pulse' : 'text-gray-600'}>
                        {s === 'fetching-utxos' ? 'UTXOs' : s === 'signing' ? 'Sign' : 'Broadcast'}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 items-center">
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !wallet.walletAddress}
                  className="bg-[#f7931a] hover:bg-[#e8840f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isDeploying && (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" className="opacity-75" />
                    </svg>
                  )}
                  {isDeploying ? statusMsg || 'Deploying…' : 'Deploy to OPNet'}
                </button>
                <button
                  onClick={closeDeploy}
                  disabled={isDeploying}
                  className="bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white disabled:opacity-50 text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <a
                  href={opscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[#f7931a] text-xs hover:underline"
                >
                  View on OPScan ↗
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TYPES.slice(0, 6).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t
                  ? 'bg-[#f7931a] text-white'
                  : 'bg-[#161616] border border-[#222] text-gray-400 hover:text-white hover:border-[#333]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, address, or tag..."
          className="ml-auto bg-[#161616] border border-[#222] rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#f7931a44] w-56"
        />
      </div>

      {/* Contracts table */}
      <div className="bg-[#161616] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#222]">
              <th className="pb-3 px-4 pt-4 text-gray-400 font-medium text-xs uppercase text-left">Contract</th>
              <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-left">Name / Description</th>
              <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-left">Type</th>
              <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-left">Tags</th>
              <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-left">Deployed By</th>
              <th className="pb-3 px-4 pt-4 text-gray-400 font-medium text-xs uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-600 text-sm">
                  No contracts match your filter.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.address} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors group">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#f7931a] font-mono text-xs">
                      {shortenAddress(c.address)}
                    </span>
                    {c.verified && (
                      <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[10px] rounded font-medium">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-[10px] mt-0.5">{c.network}</p>
                </td>
                <td className="py-3 px-3 max-w-[220px]">
                  <p className="text-white font-medium text-sm group-hover:text-[#f7931a] transition-colors">{c.name}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5 truncate">{c.description}</p>
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[c.type] ?? 'bg-gray-500/10 text-gray-400'}`}>
                    {c.type}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded border border-[#2a2a2a] text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-400 text-xs">{c.deployedBy ?? '—'}</td>
                <td className="py-3 px-4 text-right">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f7931a] text-xs hover:underline"
                  >
                    OPScan ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explorer network links */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs font-medium">Track on OPScan:</span>
        </div>
        {[
          { label: 'OPNet Testnet', url: OPSCAN_TESTNET, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20' },
          { label: 'OPNet Mainnet', url: OPSCAN_MAINNET, color: 'text-[#f7931a] border-[#f7931a30] bg-[#f7931a10] hover:bg-[#f7931a20]' },
          { label: 'BTC Regtest',   url: OPSCAN_REGTEST, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20' },
        ].map(({ label, url, color }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${color}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {label} ↗
          </a>
        ))}
        <span className="ml-auto text-gray-700 text-[10px]">opscan.org</span>
      </div>
    </div>
  );
}
