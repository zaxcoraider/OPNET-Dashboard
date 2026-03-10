"use client";

import React from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import Table from "../ui/Table";
import { useWallet } from "@/hooks/useWallet";
import { useOverviewData } from "@/hooks/useOverviewData";
import { timeAgo } from "@/lib/opnetRpc";

/* ── helpers ── */
function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtGas(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "G";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return n.toLocaleString();
}

function getNetworkLabel(name: string | null | undefined): string {
  if (!name) return "OPNet Testnet"; // null = Signet/OPNet testnet
  const n = name.toLowerCase();
  if (n === "mainnet" || n === "bitcoin") return "Bitcoin Mainnet";
  return "OPNet Testnet";
}

function getNetworkType(
  walletAddress: string | null,
  name: string | null | undefined
): "btc-mainnet" | "opnet-testnet" | "disconnected" {
  if (!walletAddress) return "disconnected";
  if (!name) return "opnet-testnet"; // null network while connected = Signet/OPNet testnet
  const n = name.toLowerCase();
  if (n === "mainnet" || n === "bitcoin") return "btc-mainnet";
  return "opnet-testnet";
}

/* ── tooltip ── */
const CustomTooltip = ({
  active, payload, label,
}: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white font-semibold">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

import type { BlockSummary } from "@/hooks/useOverviewData";

/* ── block table columns ── */
const blockCols = [
  {
    key: "height", label: "Block",
    render: (r: BlockSummary) => (
      <span className="text-[#f7931a] font-mono text-xs font-semibold">
        #{r.height.toLocaleString()}
      </span>
    ),
  },
  { key: "txCount", label: "TXs",
    render: (r: BlockSummary) => (
      <span className="text-white font-mono text-xs">{fmtNum(r.txCount)}</span>
    ),
  },
  { key: "gasUsed", label: "Gas Used",
    render: (r: BlockSummary) => (
      <span className="text-purple-400 font-mono text-xs">{fmtGas(r.gasUsed)}</span>
    ),
  },
  { key: "size", label: "Size",
    render: (r: BlockSummary) => (
      <span className="text-gray-400 text-xs">{(r.size / 1024).toFixed(1)} KB</span>
    ),
  },
  { key: "time", label: "Time", align: "right" as const,
    render: (r: BlockSummary) => (
      <span className="text-gray-500 text-xs">{r.time ? timeAgo(r.time) : "—"}</span>
    ),
  },
];

/* ── disconnected banner ── */
function DisconnectedBanner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f7931a22] to-[#7b3fe422] border border-[#f7931a22] flex items-center justify-center text-3xl">
        ⬡
      </div>
      <h2 className="text-white text-xl font-bold">No Network Connected</h2>
      <p className="text-gray-500 text-sm text-center max-w-sm">
        Connect your wallet using the button in the header to view live data for Bitcoin Mainnet or OPNet Testnet.
      </p>
    </div>
  );
}

/* ── skeleton ── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1e1e1e] rounded ${className}`} />;
}

/* ── main component ── */
export default function Overview() {
  const { network, walletAddress } = useWallet();
  const netType = getNetworkType(walletAddress, network?.network);
  const netLabel = getNetworkLabel(network?.network);
  const isTestnet = netType === "opnet-testnet";

  const data = useOverviewData(netType);

  if (netType === "disconnected") return <DisconnectedBanner />;

  const latestBlock = data.recentBlocks[data.recentBlocks.length - 1];

  /* chart data — label each block with its height */
  const chartBlocks = data.recentBlocks.map((b) => ({
    block: `#${b.height.toLocaleString()}`,
    txs: b.txCount,
    gas: Math.round(b.gasUsed / 1e9), // show in Giga-gas
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Network Overview</h1>
          <p className="text-gray-500 text-sm mt-1">
            Live data from{" "}
            <span className={isTestnet ? "text-purple-400" : "text-orange-400"}>
              {netLabel}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.loading && (
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 border border-gray-500 border-t-transparent rounded-full animate-spin inline-block" />
              Updating…
            </span>
          )}
          {data.lastUpdated && !data.loading && (
            <span className="text-xs text-gray-600">
              Updated {data.lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {data.error && (
            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
              {data.error}
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {data.loading && !data.blockHeight ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))
        ) : (
          <>
            <StatCard
              title="Block Height"
              value={data.blockHeight ? `#${data.blockHeight.toLocaleString()}` : "—"}
              change={latestBlock ? `${fmtNum(latestBlock.txCount)} TXs in latest block` : ""}
              changePositive={true}
              icon="⬡"
              accent="orange"
            />
            <StatCard
              title="TXs (Latest Block)"
              value={latestBlock ? fmtNum(latestBlock.txCount) : "—"}
              change={latestBlock ? `Block size: ${latestBlock.size ? (latestBlock.size / 1024).toFixed(1) + " KB" : "—"}` : ""}
              changePositive={true}
              icon="◉"
              accent="orange"
            />
            <StatCard
              title="BTC Fee (sat/vB)"
              value={data.gasParams ? `${data.gasParams.btcFeeMed}` : "—"}
              change={data.gasParams
                ? `Low: ${data.gasParams.btcFeeLow} · High: ${data.gasParams.btcFeeHigh}`
                : ""}
              changePositive={true}
              icon="◈"
              accent="purple"
            />
            <StatCard
              title={isTestnet ? "OPNet Gas Used" : "Base Gas"}
              value={data.gasParams ? fmtGas(isTestnet ? data.gasParams.gasUsed : data.gasParams.baseGas) : "—"}
              change={data.gasParams
                ? `Gas/sat: ${fmtNum(data.gasParams.gasPerSat)}`
                : ""}
              changePositive={true}
              icon="⬟"
              accent="purple"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard
          title="Transactions Per Block"
          subtitle={`Last ${data.recentBlocks.length} blocks on ${netLabel}`}
        >
          {data.loading && !chartBlocks.length ? (
            <Skeleton className="h-[220px]" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartBlocks}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="block" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="txs" name="TXs" stroke="#f7931a" strokeWidth={2} fill="url(#txGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Gas Used Per Block (Ggas)"
          subtitle={`Last ${data.recentBlocks.length} blocks · unit: Giga-gas`}
        >
          {data.loading && !chartBlocks.length ? (
            <Skeleton className="h-[220px]" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartBlocks} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                <XAxis dataKey="block" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}G`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="gas" name="Gas (Ggas)" fill={isTestnet ? "#7b3fe4" : "#f7931a"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Recent Blocks */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Recent Blocks</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Latest {data.recentBlocks.length} blocks on {netLabel}
            </p>
          </div>
          {data.loading && (
            <span className="w-3 h-3 border border-[#f7931a] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        {data.loading && !data.recentBlocks.length ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : (
          <Table
            columns={blockCols}
            data={[...data.recentBlocks].reverse()}
          />
        )}
      </div>
    </div>
  );
}
