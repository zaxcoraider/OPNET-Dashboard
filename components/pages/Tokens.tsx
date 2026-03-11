"use client";

import React, { useState, useEffect } from "react";
import { fetchBtcPrice } from "../../lib/networkStats";
import { rpc } from "../../lib/opnetRpc";
import { fromBase64, decodeBigInt256, formatTokenBalance } from "../../lib/abiUtils";

/* ── Known OP20 tokens ─────────────────────────────────────────────────── */

const MOTO_CONTRACT = '0x75bd98b086b71010448ec5722b6020ce1e0f2c09f5d680c84059db1295948cf8';
const TOTAL_SUPPLY_SEL = '0x18160ddd'; // totalSupply()

interface Token {
  rank: number;
  name: string;
  symbol: string;
  network: 'BTC' | 'OP20' | 'Ordinals';
  price: string;
  priceNum: number;
  change24h: number;
  change7d: number;
  marketCap: string;
  volume24h: string;
  holders: string;
  contract?: string;
  liveSupply?: string;
}

const BASE_TOKENS: Omit<Token, 'rank'>[] = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'BTC',
    price: '—',
    priceNum: 0,
    change24h: 0,
    change7d: 0,
    marketCap: '—',
    volume24h: '—',
    holders: '~50M',
  },
  {
    name: 'MOTO Token',
    symbol: 'MOTO',
    network: 'OP20',
    price: '—',
    priceNum: 0,
    change24h: 14.2,
    change7d: 31.4,
    marketCap: '—',
    volume24h: '—',
    holders: '—',
    contract: MOTO_CONTRACT,
  },
  {
    name: 'Ordinals',
    symbol: 'ORDI',
    network: 'Ordinals',
    price: '—',
    priceNum: 0,
    change24h: -3.2,
    change7d: 5.8,
    marketCap: '—',
    volume24h: '—',
    holders: '62.4K',
  },
  {
    name: 'Satoshi Token',
    symbol: 'SATS',
    network: 'Ordinals',
    price: '—',
    priceNum: 0,
    change24h: 7.8,
    change7d: 22.3,
    marketCap: '—',
    volume24h: '—',
    holders: '148K',
  },
  {
    name: 'Rune',
    symbol: 'RUNE',
    network: 'Ordinals',
    price: '—',
    priceNum: 0,
    change24h: -1.4,
    change7d: -8.2,
    marketCap: '—',
    volume24h: '—',
    holders: '38.2K',
  },
  {
    name: 'PuSd Stablecoin',
    symbol: 'PuSd',
    network: 'OP20',
    price: '$1.00',
    priceNum: 1,
    change24h: 0.05,
    change7d: 0.1,
    marketCap: '—',
    volume24h: '—',
    holders: '—',
  },
  {
    name: 'SignalFi Token',
    symbol: 'SIGNAL',
    network: 'OP20',
    price: '—',
    priceNum: 0,
    change24h: 9.4,
    change7d: 18.7,
    marketCap: '—',
    volume24h: '—',
    holders: '—',
  },
  {
    name: 'Aura Token',
    symbol: 'AURA',
    network: 'OP20',
    price: '—',
    priceNum: 0,
    change24h: 5.1,
    change7d: 12.3,
    marketCap: '—',
    volume24h: '—',
    holders: '—',
  },
];

type SortKey = 'rank' | 'priceNum' | 'change24h' | 'change7d';
type NetFilter = 'All' | 'BTC' | 'OP20' | 'Ordinals';

const NET_COLORS: Record<string, string> = {
  BTC:      'text-[#f7931a] bg-[#f7931a15] border-[#f7931a30]',
  OP20:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Ordinals: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

async function fetchMotoTotalSupply(): Promise<string | null> {
  try {
    interface CallResp { result?: string; revert?: string }
    const res = await rpc<CallResp>('btc-mainnet', 'btc_call', [
      { to: MOTO_CONTRACT, calldata: TOTAL_SUPPLY_SEL },
    ]);
    if (res.revert || !res.result) return null;
    const bytes = fromBase64(res.result);
    if (!bytes.length) return null;
    const raw = decodeBigInt256(bytes);
    return formatTokenBalance(raw, 8, 'MOTO');
  } catch {
    return null;
  }
}

export default function Tokens() {
  const [tokens,   setTokens]   = useState<Token[]>(BASE_TOKENS.map((t, i) => ({ ...t, rank: i + 1 })));
  const [sortKey,  setSortKey]  = useState<SortKey>('rank');
  const [sortAsc,  setSortAsc]  = useState(true);
  const [netFilter,setNetFilter]= useState<NetFilter>('All');
  const [btcPrice, setBtcPrice] = useState<number | null>(null);

  useEffect(() => {
    // 1. Fetch live BTC price
    fetchBtcPrice().then((price) => {
      if (!price) return;
      setBtcPrice(price);

      setTokens((prev) =>
        prev.map((t) => {
          if (t.symbol === 'BTC') {
            return {
              ...t,
              priceNum: price,
              price: `$${price.toLocaleString()}`,
              marketCap: `$${(price * 19_750_000 / 1e9).toFixed(2)}T`,
              volume24h: `$${(price * 0.022 / 1e9).toFixed(2)}B`,
            };
          }
          if (t.symbol === 'ORDI') {
            const p = price * 0.00024;
            return { ...t, priceNum: p, price: `$${p.toFixed(2)}`, marketCap: `$${(p * 21e6 / 1e6).toFixed(0)}M` };
          }
          if (t.symbol === 'SATS') {
            const p = price * 0.0000065;
            return { ...t, priceNum: p, price: `$${p.toFixed(7)}` };
          }
          if (t.symbol === 'RUNE') {
            const p = price * 0.00013;
            return { ...t, priceNum: p, price: `$${p.toFixed(4)}` };
          }
          return t;
        }),
      );
    });

    // 2. Fetch live MOTO totalSupply
    fetchMotoTotalSupply().then((supply) => {
      if (!supply) return;
      setTokens((prev) =>
        prev.map((t) =>
          t.symbol === 'MOTO' ? { ...t, liveSupply: supply } : t,
        ),
      );
    });
  }, []);

  const filtered = netFilter === 'All' ? tokens : tokens.filter((t) => t.network === netFilter);

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ label, skey }: { label: string; skey: SortKey }) => (
    <th
      className="pb-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wide text-right cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => toggleSort(skey)}
    >
      {label} {sortKey === skey ? (sortAsc ? '▲' : '▼') : ''}
    </th>
  );

  const op20Count     = tokens.filter((t) => t.network === 'OP20').length;
  const ordinalsCount = tokens.filter((t) => t.network === 'Ordinals').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Tokens</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bitcoin-native tokens — BTC, OP20, and Ordinals
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-right bg-[#161616] border border-[#222] rounded-lg px-4 py-2">
            <p className="text-gray-500 text-[10px]">OP20 Tokens</p>
            <p className="text-[#f7931a] font-bold">{op20Count}</p>
          </div>
          <div className="text-right bg-[#161616] border border-[#222] rounded-lg px-4 py-2">
            <p className="text-gray-500 text-[10px]">BTC Price</p>
            <p className="text-white font-bold">
              {btcPrice ? `$${btcPrice.toLocaleString()}` : '…'}
            </p>
          </div>
        </div>
      </div>

      {/* Network filter */}
      <div className="flex items-center gap-2">
        {(['All', 'BTC', 'OP20', 'Ordinals'] as NetFilter[]).map((net) => (
          <button
            key={net}
            onClick={() => setNetFilter(net)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              netFilter === net
                ? 'bg-[#f7931a] text-white shadow-[0_0_10px_rgba(247,147,26,0.25)]'
                : 'bg-[#161616] border border-[#222] text-gray-400 hover:text-white hover:border-[#333]'
            }`}
          >
            {net === 'All' ? `All (${tokens.length})` : `${net} (${net === 'BTC' ? 1 : net === 'OP20' ? op20Count : ordinalsCount})`}
          </button>
        ))}
      </div>

      {/* MOTO live banner */}
      {tokens.find((t) => t.symbol === 'MOTO')?.liveSupply && (
        <div className="bg-[#161616] border border-[#f7931a33] rounded-xl p-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-[#f7931a18] flex items-center justify-center text-lg">🔄</div>
          <div>
            <p className="text-white text-sm font-semibold">MOTO Token — Live On-Chain Data</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Total Supply (live): <span className="text-[#f7931a] font-mono font-semibold">
                {tokens.find((t) => t.symbol === 'MOTO')?.liveSupply}
              </span>
              {' '}· Contract: <span className="text-gray-400 font-mono text-[10px]">{MOTO_CONTRACT.slice(0, 18)}…</span>
            </p>
          </div>
          <a
            href="https://motoswap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-[#f7931a] text-xs font-medium hover:underline flex-shrink-0"
          >
            Trade on Motoswap ↗
          </a>
        </div>
      )}

      {/* Token table */}
      <div className="bg-[#161616] border border-[#222] rounded-xl overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="pb-3 px-4 pt-4 text-gray-400 font-medium text-xs uppercase tracking-wide text-left w-8">#</th>
                <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase tracking-wide text-left">Token</th>
                <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase tracking-wide text-left">Network</th>
                <SortHeader label="Price" skey="priceNum" />
                <SortHeader label="24h %" skey="change24h" />
                <SortHeader label="7d %" skey="change7d" />
                <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase tracking-wide text-right">Market Cap</th>
                <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase tracking-wide text-right">Vol (24h)</th>
                <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase tracking-wide text-right">Holders</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((token) => (
                <tr
                  key={token.symbol}
                  className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{token.rank}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f7931a44] to-[#7b3fe444] flex items-center justify-center border border-[#333] flex-shrink-0">
                        <span className="text-white text-xs font-bold">{token.symbol[0]}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm group-hover:text-[#f7931a] transition-colors">{token.name}</p>
                        <p className="text-gray-500 text-xs font-mono">{token.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${NET_COLORS[token.network] ?? ''}`}>
                      {token.network}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right text-white font-mono text-sm">
                    {token.price === '—' || token.priceNum === 0
                      ? <span className="text-gray-600">—</span>
                      : token.price}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className={`font-semibold text-sm ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className={`font-semibold text-sm ${token.change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change7d >= 0 ? '+' : ''}{token.change7d}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right text-gray-300 text-sm">{token.marketCap}</td>
                  <td className="py-3.5 px-3 text-right text-gray-300 text-sm">{token.volume24h}</td>
                  <td className="py-3.5 px-3 text-right text-gray-300 text-sm">{token.holders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-gray-700 text-[10px] text-center">
        BTC price: mempool.space · MOTO supply: OPNet mainnet RPC live data · Prices for Ordinals tokens are indicative
      </p>
    </div>
  );
}
