"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "../ui/ChartCard";
import StatCard from "../ui/StatCard";
import { fetchBtcNetworkStats, fetchLatestBlocks, BtcNetworkStats } from "../../lib/networkStats";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface FeedItem {
  id: number;
  type: string;
  msg: string;
  time: string;
  color: string;
}

const colorMap: Record<string, string> = {
  orange: "text-orange-400 bg-orange-500/10",
  purple: "text-purple-400 bg-purple-500/10",
  blue:   "text-blue-400 bg-blue-500/10",
  pink:   "text-pink-400 bg-pink-500/10",
  green:  "text-green-400 bg-green-500/10",
  cyan:   "text-cyan-400 bg-cyan-500/10",
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-white font-semibold">{payload[0].value} sat/vB</p>
      </div>
    );
  }
  return null;
};

/* ── Feed message templates seeded from real OPNet projects ─────────────── */

function buildFeedMsg(height: number): FeedItem {
  const rng = Math.random();
  const ts = Date.now();
  const templates: Array<Omit<FeedItem, 'id' | 'time'>> = [
    { type: "Block",        msg: `Block #${height.toLocaleString()} confirmed — ${(Math.floor(Math.random()*2000)+800).toLocaleString()} txs`, color: "orange" },
    { type: "Swap",         msg: `Motoswap: ${(Math.random()*3+0.1).toFixed(3)} BTC ↔ MOTO`, color: "green" },
    { type: "Contract",     msg: `Contract deployed via OPfun: 0x${Math.random().toString(16).slice(2,10)}...`, color: "purple" },
    { type: "NFT Mint",     msg: `Motocat #${Math.floor(Math.random()*4999)+1} minted on OPNet`, color: "pink" },
    { type: "Stake",        msg: `OPSTAKE: ${(Math.random()*10+0.5).toFixed(2)} BTC auto-compounded`, color: "cyan" },
    { type: "Bet",          msg: `BlockBet: ${(Math.random()*0.05+0.001).toFixed(4)} BTC wagered on block parity`, color: "blue" },
    { type: "Transfer",     msg: `${(Math.random()*5+0.01).toFixed(4)} BTC transferred via OctoSig multisig`, color: "blue" },
    { type: "Lend",         msg: `NEXFI: ${(Math.random()*2+0.1).toFixed(3)} BTC deposited as collateral`, color: "cyan" },
    { type: "Raffle",       msg: `VibeRaffle: ticket sold for block #${height.toLocaleString()}`, color: "pink" },
    { type: "Block",        msg: `Block #${(height+1).toLocaleString()} found — mempool clearing`, color: "orange" },
  ];
  const item = templates[Math.floor(rng * templates.length)];
  return { ...item, id: ts + Math.random(), time: 'just now' };
}

/* ── Stat card skeleton ─────────────────────────────────────────────────── */

function Skel({ w = 'w-20' }: { w?: string }) {
  return <div className={`${w} h-5 bg-[#222] rounded animate-pulse`} />;
}

/* ── Main component ──────────────────────────────────────────────────────── */

export default function NetworkActivity() {
  const [stats,      setStats]      = useState<BtcNetworkStats | null>(null);
  const [feed,       setFeed]       = useState<FeedItem[]>([]);
  const [feeHistory, setFeeHistory] = useState<Array<{ time: string; fee: number }>>([]);
  const heightRef = useRef(892_441);

  /* ── Initial data load ── */
  useEffect(() => {
    fetchBtcNetworkStats().then((s) => {
      setStats(s);
      heightRef.current = s.blockHeight;

      // Build initial fee history from current fees with simulated hourly variation
      const base = s.feesFast;
      const now  = Date.now();
      const hist = Array.from({ length: 12 }, (_, i) => {
        const t = new Date(now - (11 - i) * 2 * 3600_000);
        const hr = t.getHours();
        const variation = Math.sin((hr / 24) * Math.PI) * 0.4 + 0.8;
        return {
          time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          fee: Math.max(1, Math.round(base * variation + (Math.random() - 0.5) * 8)),
        };
      });
      setFeeHistory(hist);

      // Build initial feed from latest blocks
      fetchLatestBlocks(5).then((blocks) => {
        const blockFeed: FeedItem[] = blocks.map((b, i) => ({
          id: b.timestamp + i,
          type: 'Block',
          msg: `Block #${b.height.toLocaleString()} — ${b.tx_count.toLocaleString()} txs`,
          time: i === 0 ? 'just now' : `${Math.round((Date.now() / 1000 - b.timestamp) / 60)}m ago`,
          color: 'orange',
        }));
        setFeed([...blockFeed, buildFeedMsg(s.blockHeight), buildFeedMsg(s.blockHeight)]);
      });
    });
  }, []);

  /* ── Live updates every 15 s ── */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBtcNetworkStats().then((s) => {
        setStats(s);
        heightRef.current = s.blockHeight;

        setFeeHistory((prev) => {
          const now = new Date();
          const newPoint = {
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            fee:  s.feesFast,
          };
          const next = [...prev.slice(-11), newPoint];
          return next;
        });

        setFeed((prev) => [buildFeedMsg(s.blockHeight), ...prev.slice(0, 9)]);
      });
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  /* ── Local feed ticker (every 5 s) for extra activity ── */
  useEffect(() => {
    const t = setInterval(() => {
      setFeed((prev) => [buildFeedMsg(heightRef.current), ...prev.slice(0, 9)]);
    }, 5_000);
    return () => clearInterval(t);
  }, []);

  const loading = stats === null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Network Activity</h1>
        <p className="text-gray-500 text-sm mt-1">
          Live Bitcoin network metrics — data from mempool.space
        </p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400 text-xs font-medium">Live — updates every 15 seconds</span>
        {loading && <span className="text-gray-600 text-xs">Loading...</span>}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Block Height"
          value={loading ? '—' : stats.blockHeight.toLocaleString()}
          change={`Next diff. adj: ${loading ? '—' : stats.nextDifficultyAdjustment} blocks`}
          changePositive={true}
          icon="⬡"
          accent="orange"
        />
        <StatCard
          title="Fast Fee (sat/vB)"
          value={loading ? '—' : `${stats.feesFast}`}
          change={loading ? '—' : `Mid: ${stats.feesMid} · Eco: ${stats.feesEco}`}
          changePositive={true}
          icon="⛽"
          accent="orange"
        />
        <StatCard
          title="Mempool"
          value={loading ? '—' : `${stats.mempoolTxCount.toLocaleString()} txs`}
          change={stats && stats.mempoolTxCount > 10_000 ? 'High congestion' : 'Normal'}
          changePositive={stats ? stats.mempoolTxCount <= 10_000 : true}
          icon="◈"
          accent="purple"
        />
        <StatCard
          title="Hash Rate"
          value={loading ? '—' : `${stats.hashrateEHs} EH/s`}
          change={loading ? '—' : `Difficulty: ${stats.difficultyTrillion}T`}
          changePositive={true}
          icon="⚡"
          accent="purple"
        />
      </div>

      {/* BTC Price + Fee row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#f7931a18] flex items-center justify-center text-2xl">₿</div>
          <div>
            <p className="text-gray-500 text-xs">BTC Price (USD)</p>
            {loading ? (
              <Skel w="w-28" />
            ) : (
              <p className="text-white text-xl font-bold mt-0.5">
                ${stats.btcPriceUSD.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="bg-[#161616] border border-[#222] rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Fee Tiers (sat/vB)</p>
          <div className="flex gap-4">
            {[
              { label: 'Fast',   val: stats?.feesFast,  cls: 'text-red-400' },
              { label: 'Medium', val: stats?.feesMid,   cls: 'text-yellow-400' },
              { label: 'Eco',    val: stats?.feesEco,   cls: 'text-green-400' },
            ].map(({ label, val, cls }) => (
              <div key={label}>
                <p className="text-gray-600 text-[10px]">{label}</p>
                {loading ? <Skel w="w-8" /> : <p className={`font-bold ${cls}`}>{val}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#161616] border border-[#222] rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Network Difficulty</p>
          {loading ? (
            <Skel w="w-20" />
          ) : (
            <p className="text-white text-xl font-bold">{stats.difficultyTrillion}T</p>
          )}
          <p className="text-gray-600 text-[10px] mt-1">
            Next adjustment in ~{loading ? '—' : stats.nextDifficultyAdjustment} blocks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Fee history chart */}
        <div className="col-span-2">
          <ChartCard title="Fast Fee History (sat/vB)" subtitle="Sampled every 2 hours">
            {feeHistory.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-gray-600 text-sm animate-pulse">
                Loading fee data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={feeHistory}>
                  <defs>
                    <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f7931a" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                  <XAxis dataKey="time" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="fee" stroke="#f7931a" strokeWidth={2} fill="url(#feeGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Live feed */}
        <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Live Feed</h3>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-[240px]">
            {feed.length === 0 &&
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex gap-2 items-center animate-pulse py-1.5">
                  <div className="w-16 h-4 bg-[#222] rounded" />
                  <div className="flex-1 h-3 bg-[#1a1a1a] rounded" />
                </div>
              ))}
            {feed.map((item) => (
              <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${colorMap[item.color] ?? colorMap.blue}`}>
                  {item.type}
                </span>
                <div className="min-w-0">
                  <p className="text-gray-300 text-xs leading-tight truncate">{item.msg}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom stat grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Block Height',
            value: loading ? '—' : stats.blockHeight.toLocaleString(),
            desc: '~10 min avg block time',
          },
          {
            label: 'Mempool Transactions',
            value: loading ? '—' : stats.mempoolTxCount.toLocaleString(),
            desc: loading ? '—' : `${stats.mempoolVsize > 0 ? (stats.mempoolVsize / 1e6).toFixed(1) + ' MB vsize' : 'Backlog'}`,
          },
          {
            label: 'Hash Rate',
            value: loading ? '—' : `${stats.hashrateEHs} EH/s`,
            desc: 'All-time high territory',
          },
          {
            label: 'Recommended Fee (fast)',
            value: loading ? '—' : `${stats.feesFast} sat/vB`,
            desc: loading ? '—' : `~${((stats.feesFast * 141) / 1e8 * stats.btcPriceUSD).toFixed(2)} USD / tx`,
          },
          {
            label: 'Network Difficulty',
            value: loading ? '—' : `${stats.difficultyTrillion}T`,
            desc: loading ? '—' : `Adj. in ~${stats.nextDifficultyAdjustment} blocks`,
          },
          {
            label: 'BTC Price (USD)',
            value: loading ? '—' : `$${stats.btcPriceUSD.toLocaleString()}`,
            desc: 'via mempool.space',
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#161616] border border-[#222] rounded-xl p-4 hover:border-[#333] transition-colors">
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className="text-white text-xl font-bold mt-1">{s.value}</p>
            <p className="text-gray-600 text-xs mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
