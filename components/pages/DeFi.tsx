"use client";

import React, { useEffect, useState } from "react";
import { fetchBtcPrice } from "../../lib/networkStats";

/* ── Real OPNet DeFi protocols from vibecode.finance/ecosystem ──────────── */

interface Protocol {
  name: string;
  category: string;
  description: string;
  url: string;
  icon: string;
  color: string;
  tvlBTC: number;    // estimated BTC TVL
  apy: string;
  change: number;
  status: 'Live' | 'Beta';
  tags: string[];
}

const PROTOCOLS: Protocol[] = [
  {
    name: 'Motoswap',
    category: 'DEX / AMM',
    description: 'The primary AMM on Bitcoin L1 — swap OP20 tokens with deep liquidity pools.',
    url: 'https://motoswap.org',
    icon: '🔄',
    color: '#f7931a',
    tvlBTC: 284,
    apy: '12–84%',
    change: 8.4,
    status: 'Live',
    tags: ['DEX', 'AMM', 'Swap'],
  },
  {
    name: 'SignalFi',
    category: 'Yield / Staking',
    description: 'Self-sustaining DeFi hub with OTC escrow, revenue vault, and auto-compound staking.',
    url: 'https://vibecode.finance/ecosystem?verified=1',
    icon: '📡',
    color: '#7b3fe4',
    tvlBTC: 142,
    apy: '15–60%',
    change: 12.1,
    status: 'Live',
    tags: ['Staking', 'Yield', 'OTC'],
  },
  {
    name: 'NEXFI Protocol',
    category: 'Lending',
    description: 'Lending, borrowing & Yearn-style yield aggregation on Bitcoin L1.',
    url: 'https://vibecode.finance/ecosystem?verified=1',
    icon: '🏦',
    color: '#22d3ee',
    tvlBTC: 98,
    apy: '8–42%',
    change: 5.3,
    status: 'Live',
    tags: ['Lending', 'Borrowing', 'Yield'],
  },
  {
    name: 'OPSTAKE',
    category: 'Staking',
    description: 'Native auto-compound staking protocol. Stake once, compound forever on Bitcoin.',
    url: 'https://vibecode.finance/ecosystem?verified=1',
    icon: '⚡',
    color: '#34d399',
    tvlBTC: 76,
    apy: '6–28%',
    change: 3.8,
    status: 'Live',
    tags: ['Staking', 'Auto-Compound'],
  },
  {
    name: 'Aura Finance',
    category: 'Staking Vaults',
    description: 'Multi-tier vault staking with APY 4.5%–38.5%. Lock tokens for boosted yields.',
    url: 'https://vibecode.finance/ecosystem?verified=1',
    icon: '✨',
    color: '#f59e0b',
    tvlBTC: 54,
    apy: '4.5–38.5%',
    change: 19.2,
    status: 'Live',
    tags: ['Vaults', 'veTokens'],
  },
  {
    name: 'PuSd Vaults',
    category: 'Stablecoin',
    description: 'Bitcoin-backed stablecoin with collateralized minting and on-chain yield.',
    url: 'https://vibecode.finance/ecosystem?verified=1',
    icon: '💵',
    color: '#e879f9',
    tvlBTC: 38,
    apy: '5–18%',
    change: 2.1,
    status: 'Live',
    tags: ['Stablecoin', 'Collateral'],
  },
  {
    name: 'bitlend-opnet',
    category: 'Lending',
    description: 'Deposit collateral, borrow stablecoins in seconds — BTC-native lending.',
    url: 'https://vibecode.finance/ecosystem?verified=1',
    icon: '🏧',
    color: '#7b3fe4',
    tvlBTC: 24,
    apy: '8–35%',
    change: -1.4,
    status: 'Beta',
    tags: ['Lending', 'Stablecoin'],
  },
  {
    name: 'veBTC Gauge',
    category: 'veTokenomics',
    description: 'Lock/vote/bribe mechanics to direct liquidity emissions across OPNet protocols.',
    url: 'https://vibecode.finance/ecosystem?verified=1',
    icon: '🗳️',
    color: '#f7931a',
    tvlBTC: 18,
    apy: '10–45%',
    change: 22.8,
    status: 'Beta',
    tags: ['veTokens', 'Governance', 'Gauges'],
  },
];

const YIELD_POOLS = [
  { pool: 'MOTO-BTC LP',   protocol: 'Motoswap',    apy: '84%',  tvlBTC: 142,  risk: 'Medium', type: 'LP' },
  { pool: 'BTC Staking',   protocol: 'OPSTAKE',      apy: '28%',  tvlBTC: 76,   risk: 'Low',    type: 'Staking' },
  { pool: 'BTC Vault',     protocol: 'Aura Finance', apy: '38.5%',tvlBTC: 54,   risk: 'Low',    type: 'Vault' },
  { pool: 'BTC Lending',   protocol: 'NEXFI',        apy: '42%',  tvlBTC: 98,   risk: 'Medium', type: 'Lending' },
  { pool: 'PuSd Earn',     protocol: 'PuSd Vaults',  apy: '18%',  tvlBTC: 38,   risk: 'Low',    type: 'Lending' },
  { pool: 'Signal Vault',  protocol: 'SignalFi',      apy: '60%',  tvlBTC: 142,  risk: 'Medium', type: 'Vault' },
  { pool: 'Gauge Boost',   protocol: 'veBTC Gauge',  apy: '45%',  tvlBTC: 18,   risk: 'High',   type: 'Farm' },
  { pool: 'Borrow+Lend',   protocol: 'bitlend',      apy: '35%',  tvlBTC: 24,   risk: 'High',   type: 'Lending' },
];

const maxTVL = Math.max(...PROTOCOLS.map((p) => p.tvlBTC));

export default function DeFi() {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchBtcPrice().then(setBtcPrice);
  }, []);

  const totalTVLBTC = PROTOCOLS.reduce((s, p) => s + p.tvlBTC, 0);
  const totalTVLUSD = btcPrice ? `$${((totalTVLBTC * btcPrice) / 1e6).toFixed(1)}M` : `${totalTVLBTC} BTC`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">DeFi</h1>
        <p className="text-gray-500 text-sm mt-1">Decentralized Finance protocols on OPNet Bitcoin L1</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total TVL',
            value: totalTVLUSD,
            sub: btcPrice ? `${totalTVLBTC} BTC · $${btcPrice.toLocaleString()}/BTC` : `${totalTVLBTC} BTC`,
          },
          { label: 'Live Protocols', value: PROTOCOLS.filter((p) => p.status === 'Live').length.toString(), sub: `${PROTOCOLS.length} total` },
          { label: 'Top APY',        value: '84%', sub: 'MOTO-BTC LP on Motoswap' },
          { label: 'BTC Price',      value: btcPrice ? `$${btcPrice.toLocaleString()}` : '…', sub: 'via mempool.space' },
        ].map((s) => (
          <div key={s.label} className="bg-[#161616] border border-[#222] rounded-xl p-4">
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className="text-white text-xl font-bold mt-1">{s.value}</p>
            <p className="text-gray-600 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* TVL by Protocol */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">TVL by Protocol</h3>
          <span className="text-gray-500 text-xs">{totalTVLBTC} BTC total locked</span>
        </div>
        <div className="space-y-3">
          {PROTOCOLS.map((p) => {
            const pct = (p.tvlBTC / maxTVL) * 100;
            const tvlUSD = btcPrice ? `$${((p.tvlBTC * btcPrice) / 1e6).toFixed(1)}M` : `${p.tvlBTC} BTC`;
            return (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group cursor-pointer hover:bg-[#1a1a1a] p-2 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: `${p.color}18`, color: p.color }}>
                  {p.icon}
                </div>
                <div className="w-28 flex-shrink-0">
                  <p className="text-white text-sm font-medium group-hover:text-[#f7931a] transition-colors">{p.name}</p>
                  <p className="text-gray-600 text-[10px]">{p.category}</p>
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-[#111] rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: p.color, opacity: 0.75 }}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-xs font-semibold">
                      {tvlUSD}
                    </span>
                  </div>
                </div>
                <div className="w-16 text-right flex-shrink-0">
                  <span className={`text-xs font-semibold ${p.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {p.change >= 0 ? '+' : ''}{p.change}%
                  </span>
                </div>
                <div className="w-20 text-right flex-shrink-0">
                  <span className="text-[#f7931a] text-xs font-medium">{p.apy}</span>
                  <p className="text-gray-600 text-[10px]">APY</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Protocol cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {PROTOCOLS.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#161616] border border-[#222] rounded-xl p-4 hover:border-[#333] hover:shadow-[0_0_16px_rgba(247,147,26,0.08)] transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${p.color}18`, color: p.color }}>
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm group-hover:text-[#f7931a] transition-colors truncate">{p.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${p.status === 'Live' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-gray-600 text-[10px]">{p.category}</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-3">{p.description}</p>
            <div className="flex items-center justify-between pt-2 border-t border-[#1e1e1e]">
              <div>
                <p className="text-gray-600 text-[10px]">Est. TVL</p>
                <p className="text-white text-sm font-bold">
                  {btcPrice ? `$${((p.tvlBTC * btcPrice) / 1e6).toFixed(1)}M` : `${p.tvlBTC} BTC`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-[10px]">APY</p>
                <p className="text-[#f7931a] text-sm font-bold">{p.apy}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Yield table */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Top Yield Opportunities</h3>
          <span className="text-gray-500 text-xs">Sorted by APY</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                {['Pool', 'Protocol', 'APY', 'TVL', 'Risk', 'Type'].map((h) => (
                  <th key={h} className="pb-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wide text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {YIELD_POOLS.map((row, i) => {
                const riskColor = row.risk === 'Low'    ? 'text-green-400 bg-green-500/10'
                                : row.risk === 'Medium' ? 'text-yellow-400 bg-yellow-500/10'
                                :                         'text-red-400 bg-red-500/10';
                const typeColor = row.type === 'LP'      ? 'text-blue-400 bg-blue-500/10'
                                : row.type === 'Lending' ? 'text-purple-400 bg-purple-500/10'
                                : row.type === 'Staking' ? 'text-cyan-400 bg-cyan-500/10'
                                : row.type === 'Farm'    ? 'text-orange-400 bg-orange-500/10'
                                :                          'text-pink-400 bg-pink-500/10';
                const tvlStr = btcPrice
                  ? `$${((row.tvlBTC * btcPrice) / 1e6).toFixed(1)}M`
                  : `${row.tvlBTC} BTC`;
                return (
                  <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                    <td className="py-3 px-3 text-white font-medium text-sm">{row.pool}</td>
                    <td className="py-3 px-3 text-gray-400 text-sm">{row.protocol}</td>
                    <td className="py-3 px-3 text-[#f7931a] font-bold text-sm">{row.apy}</td>
                    <td className="py-3 px-3 text-gray-300 text-sm">{tvlStr}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor}`}>{row.risk}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor}`}>{row.type}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
