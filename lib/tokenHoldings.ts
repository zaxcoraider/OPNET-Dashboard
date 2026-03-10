/**
 * Fetch OP20 token and OP721 NFT holdings for an address via OPNet RPC btc_call.
 */

import { rpc } from './opnetRpc';
import {
  addressToBytes32,
  addressToHex,
  encodeBalanceOf,
  fromBase64,
  decodeBigInt256,
  decodeOPNetString,
  decodeU8,
  formatTokenBalance,
  SEL,
} from './abiUtils';

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface TokenHolding {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceDisplay: string;
  type: 'OP20';
}

export interface NftHolding {
  contractAddress: string;
  name: string;
  symbol: string;
  count: bigint;
  type: 'OP721';
}

interface CallResponse {
  result?: string;
  revert?:  string;
}

/* ── Known contracts ────────────────────────────────────────────────────── */

const MAINNET_TOKENS: string[] = [
  '0x75bd98b086b71010448ec5722b6020ce1e0f2c09f5d680c84059db1295948cf8', // MOTO
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

async function callContract(
  network: 'btc-mainnet' | 'opnet-testnet',
  contractAddress: string,
  calldataHex: string,
): Promise<Uint8Array | null> {
  try {
    const res = await rpc<CallResponse>(
      network,
      'btc_call',
      [{ to: contractAddress, calldata: calldataHex }],
    );
    if (res.revert || !res.result) return null;
    const bytes = fromBase64(res.result);
    return bytes.length > 0 ? bytes : null;
  } catch {
    return null;
  }
}

async function fetchTokenInfo(
  network: 'btc-mainnet' | 'opnet-testnet',
  contractAddress: string,
  ownerBytes32: Uint8Array,
): Promise<TokenHolding | null> {
  const balCalldata = encodeBalanceOf(ownerBytes32);

  const [nameR, symbolR, decimalsR, balR] = await Promise.allSettled([
    callContract(network, contractAddress, SEL.name),
    callContract(network, contractAddress, SEL.symbol),
    callContract(network, contractAddress, SEL.decimals),
    callContract(network, contractAddress, balCalldata),
  ]);

  const balBytes = balR.status === 'fulfilled' ? balR.value : null;
  if (!balBytes) return null;

  const balance = decodeBigInt256(balBytes);
  if (balance === 0n) return null; // skip zero-balance

  const nameBytes     = nameR.status === 'fulfilled'     ? nameR.value     : null;
  const symbolBytes   = symbolR.status === 'fulfilled'   ? symbolR.value   : null;
  const decimalsBytes = decimalsR.status === 'fulfilled' ? decimalsR.value : null;

  const name     = nameBytes     ? decodeOPNetString(nameBytes)     : shortenAddr(contractAddress);
  const symbol   = symbolBytes   ? decodeOPNetString(symbolBytes)   : '???';
  const decimals = decimalsBytes ? decodeU8(decimalsBytes)          : 8;

  return {
    contractAddress,
    name,
    symbol,
    decimals,
    balance,
    balanceDisplay: formatTokenBalance(balance, decimals, symbol),
    type: 'OP20',
  };
}

async function fetchNftInfo(
  network: 'btc-mainnet' | 'opnet-testnet',
  contractAddress: string,
  ownerBytes32: Uint8Array,
): Promise<NftHolding | null> {
  const balCalldata = encodeBalanceOf(ownerBytes32);

  const [nameR, symbolR, balR] = await Promise.allSettled([
    callContract(network, contractAddress, SEL.name),
    callContract(network, contractAddress, SEL.symbol),
    callContract(network, contractAddress, balCalldata),
  ]);

  const balBytes = balR.status === 'fulfilled' ? balR.value : null;
  if (!balBytes) return null;

  const count = decodeBigInt256(balBytes);
  if (count === 0n) return null;

  const nameBytes   = nameR.status === 'fulfilled'   ? nameR.value   : null;
  const symbolBytes = symbolR.status === 'fulfilled' ? symbolR.value : null;

  return {
    contractAddress,
    name:   nameBytes   ? decodeOPNetString(nameBytes)   : 'Unknown NFT',
    symbol: symbolBytes ? decodeOPNetString(symbolBytes) : '???',
    count,
    type:   'OP721',
  };
}

function shortenAddr(addr: string) {
  return addr.length > 14 ? addr.slice(0, 8) + '...' : addr;
}

/** Convert opt1/bc1 address string to 0x-prefixed hex for call RPC */
function toHexContractAddr(addr: string): string | null {
  if (addr.startsWith('0x')) return addr;
  return addressToHex(addr);
}

/* ── Public API ─────────────────────────────────────────────────────────── */

export async function fetchTokenHoldings(
  network: 'btc-mainnet' | 'opnet-testnet',
  address: string,
  extraContracts: string[] = [],
): Promise<TokenHolding[]> {
  const addr32 = addressToBytes32(address);
  if (!addr32) return [];

  const contractList =
    network === 'btc-mainnet'
      ? [...MAINNET_TOKENS, ...extraContracts]
      : extraContracts;

  if (contractList.length === 0) return [];

  const hexList = contractList
    .map(toHexContractAddr)
    .filter((a): a is string => a !== null);

  const results = await Promise.allSettled(
    hexList.map(c => fetchTokenInfo(network, c, addr32)),
  );

  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<TokenHolding>).value);
}

export async function fetchNftHoldings(
  network: 'btc-mainnet' | 'opnet-testnet',
  address: string,
  nftContracts: string[] = [],
): Promise<NftHolding[]> {
  const addr32 = addressToBytes32(address);
  if (!addr32 || nftContracts.length === 0) return [];

  const hexList = nftContracts
    .map(toHexContractAddr)
    .filter((a): a is string => a !== null);

  const results = await Promise.allSettled(
    hexList.map(c => fetchNftInfo(network, c, addr32)),
  );

  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<NftHolding>).value);
}

/**
 * Extract unique hex contract addresses from OPNet pending tx list.
 * These are used as candidates for token/NFT balance checks.
 */
export function extractContractsFromTxs(
  txs: Array<{ contractAddress?: string | null }>,
): string[] {
  const seen = new Set<string>();
  for (const tx of txs) {
    if (!tx.contractAddress) continue;
    const hex = toHexContractAddr(tx.contractAddress);
    if (hex) seen.add(hex);
  }
  return Array.from(seen);
}
