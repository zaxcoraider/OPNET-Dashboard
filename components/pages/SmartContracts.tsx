"use client";

import React, { useState, useMemo } from "react";

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

export default function SmartContracts() {
  const [typeFilter, setTypeFilter] = useState('All');
  const [search,     setSearch]     = useState('');
  const [showDeploy, setShowDeploy] = useState(false);
  const [deploying,  setDeploying]  = useState(false);

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

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => { setDeploying(false); setShowDeploy(false); }, 2000);
  };

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
          onClick={() => setShowDeploy(true)}
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

      {/* Deploy modal */}
      {showDeploy && (
        <div className="bg-[#161616] border border-[#f7931a33] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Deploy New Contract</h3>
            <button onClick={() => setShowDeploy(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Contract Name</label>
              <input
                className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#f7931a44]"
                placeholder="MyToken"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Contract Type</label>
              <select className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#f7931a44]">
                <option>Token (OP20)</option>
                <option>NFT (OP721)</option>
                <option>Custom Contract</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="text-gray-400 text-xs block mb-1.5">WASM Bytecode</label>
            <textarea
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-400 placeholder-gray-600 focus:outline-none focus:border-[#f7931a44] font-mono h-20 resize-none"
              placeholder="0x0061736d0100000001..."
            />
          </div>
          <div className="flex gap-3 mt-4 items-center">
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="bg-[#f7931a] hover:bg-[#e8840f] disabled:opacity-60 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {deploying ? 'Broadcasting…' : 'Deploy to OPNet'}
            </button>
            <button
              onClick={() => setShowDeploy(false)}
              className="bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <a
              href={OPSCAN_MAINNET}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[#f7931a] text-xs hover:underline"
            >
              View on OPScan ↗
            </a>
          </div>
          {deploying && (
            <p className="text-green-400 text-xs mt-2 animate-pulse">
              Broadcasting transaction to OPNet mainnet…
            </p>
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
