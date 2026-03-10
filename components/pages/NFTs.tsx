"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  COLLECTIONS,
  NftCollection,
  NftActivity,
  enrichCollections,
  fetchCollectionActivity,
  computeMarketStats,
} from "../../lib/nftMarket";

/* ── Tiny helpers ─────────────────────────────────────────────────────────── */

function KindBadge({ kind }: { kind: NftActivity["kind"] }) {
  const cfg: Record<NftActivity["kind"], { label: string; cls: string }> = {
    buy:      { label: "Buy",      cls: "bg-green-500/15 text-green-400 border border-green-500/20" },
    sell:     { label: "Sell",     cls: "bg-red-500/15 text-red-400 border border-red-500/20" },
    list:     { label: "List",     cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
    delist:   { label: "Delist",   cls: "bg-gray-500/15 text-gray-400 border border-gray-500/20" },
    transfer: { label: "Transfer", cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" },
  };
  const { label, cls } = cfg[kind] ?? cfg.transfer;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function NetworkBadge({ network }: { network: NftCollection["network"] }) {
  return network === "opnet" ? (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f7931a]/15 text-[#f7931a] border border-[#f7931a]/20">
      ⬡ OPNet
    </span>
  ) : (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-900/20 text-orange-300 border border-orange-500/20">
      ₿ Ordinals
    </span>
  );
}

/* ── Collection thumbnail ─────────────────────────────────────────────────── */

const SYMBOLS: Record<string, string> = {
  motocat_racing: "🏎",
  nodemonkes:     "🐒",
  "bitcoin-puppets": "🪆",
  quantum_cats:   "🐱",
  runestone:      "🪨",
  "bitcoin-frogs": "🐸",
  ordinalpunks:   "👤",
  omnisat:        "✦",
  "bitcoin-apes": "🦍",
};

function CollectionThumb({ col, size = "lg" }: { col: NftCollection; size?: "lg" | "sm" }) {
  const h = size === "lg" ? "h-40" : "h-12 w-12";
  const text = size === "lg" ? "text-5xl" : "text-2xl";
  const symbol = SYMBOLS[col.slug] ?? "◆";
  return (
    <div
      className={`${size === "lg" ? "w-full" : ""} ${h} rounded-xl bg-gradient-to-br ${col.bgPattern} flex items-center justify-center relative overflow-hidden flex-shrink-0`}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, ${col.color} 0%, transparent 60%)`,
        }}
      />
      <span className={`${text} relative z-10`}>{symbol}</span>
    </div>
  );
}

/* ── Activity row skeleton ────────────────────────────────────────────────── */

function ActivitySkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 py-3 border-b border-[#1a1a1a]">
      <div className="w-14 h-4 bg-[#222] rounded" />
      <div className="w-10 h-4 bg-[#222] rounded" />
      <div className="flex-1 h-4 bg-[#222] rounded" />
      <div className="w-20 h-4 bg-[#222] rounded" />
      <div className="w-24 h-4 bg-[#222] rounded" />
    </div>
  );
}

/* ── Collection detail / activity panel ──────────────────────────────────── */

function ActivityPanel({
  col,
  onClose,
}: {
  col: NftCollection;
  onClose: () => void;
}) {
  const [activity, setActivity]   = useState<NftActivity[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<"all" | "buy" | "sell" | "list">("all");

  useEffect(() => {
    setLoading(true);
    setActivity([]);
    fetchCollectionActivity(col, 40).then((acts) => {
      setActivity(acts);
      setLoading(false);
    });
  }, [col.slug]);

  const filtered =
    filter === "all" ? activity : activity.filter((a) => a.kind === filter);

  const buys   = activity.filter((a) => a.kind === "buy").length;
  const sells  = activity.filter((a) => a.kind === "sell").length;
  const lists  = activity.filter((a) => a.kind === "list").length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-[#1e1e1e]">
          <CollectionThumb col={col} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white font-bold text-lg leading-none">{col.name}</h2>
              <NetworkBadge network={col.network} />
            </div>
            <p className="text-gray-500 text-xs mt-1 truncate">{col.description}</p>
            {/* Mini stats */}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {col.floorBTC && (
                <span className="text-xs text-gray-400">
                  Floor <span className="text-[#f7931a] font-semibold">{col.floorBTC} BTC</span>
                </span>
              )}
              {col.volume7dBTC && (
                <span className="text-xs text-gray-400">
                  7d Vol <span className="text-white font-semibold">{col.volume7dBTC} BTC</span>
                </span>
              )}
              {col.supply && (
                <span className="text-xs text-gray-400">
                  Supply <span className="text-white font-semibold">{col.supply.toLocaleString()}</span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Activity summary pills */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-[#1e1e1e] flex-wrap">
          <span className="text-gray-400 text-xs font-medium mr-1">Activity</span>
          {(["all", "buy", "sell", "list"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                filter === k
                  ? "bg-[#f7931a] border-[#f7931a] text-white"
                  : "border-[#333] text-gray-400 hover:border-[#555] hover:text-white"
              }`}
            >
              {k === "all"  ? `All (${activity.length})`  :
               k === "buy"  ? `Buys (${buys})`   :
               k === "sell" ? `Sells (${sells})`  :
                              `Listings (${lists})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 px-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0f0f0f] z-10">
              <tr className="border-b border-[#1e1e1e]">
                <th className="px-4 py-2 text-gray-500 font-medium text-left">Type</th>
                <th className="px-4 py-2 text-gray-500 font-medium text-left">Token</th>
                <th className="px-4 py-2 text-gray-500 font-medium text-right">Price</th>
                <th className="px-4 py-2 text-gray-500 font-medium text-left">From</th>
                <th className="px-4 py-2 text-gray-500 font-medium text-left">To</th>
                <th className="px-4 py-2 text-gray-500 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 8 }, (_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4">
                      <ActivitySkeleton />
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-600 text-sm">
                    No activity found
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((act) => (
                  <tr
                    key={act.id}
                    className="border-b border-[#141414] hover:bg-[#161616] transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <KindBadge kind={act.kind} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-300 font-mono">{act.tokenId}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-white">
                      {act.priceDisplay ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 font-mono">
                      {act.from ?? <span className="text-gray-700">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 font-mono">
                      {act.to ?? <span className="text-gray-700">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{act.date}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Collection card (grid view) ─────────────────────────────────────────── */

function CollectionCard({
  col,
  rank,
  onClick,
}: {
  col: NftCollection;
  rank: number;
  onClick: () => void;
}) {
  const loading = col.floorBTC === undefined && col.network === "ordinals";

  return (
    <div
      onClick={onClick}
      className="bg-[#161616] border border-[#222] rounded-xl overflow-hidden hover:border-[#333] hover:shadow-[0_0_24px_rgba(247,147,26,0.1)] transition-all duration-200 cursor-pointer group"
    >
      <div className="relative">
        <CollectionThumb col={col} size="lg" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {rank === 1 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f7931a] text-white shadow">
              #1 Featured
            </span>
          )}
          <NetworkBadge network={col.network} />
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-gray-300 border border-white/10">
            {col.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white font-semibold text-sm group-hover:text-[#f7931a] transition-colors truncate">
            {col.name}
          </p>
          {col.floorChange24h != null && (
            <span
              className={`text-xs font-semibold ml-2 flex-shrink-0 ${
                col.floorChange24h >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {col.floorChange24h >= 0 ? "+" : ""}{col.floorChange24h.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-gray-600 text-[10px] truncate mb-3">{col.description}</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-600 text-[10px]">Floor Price</p>
            {loading ? (
              <div className="mt-0.5 h-4 w-20 bg-[#222] rounded animate-pulse" />
            ) : (
              <p className="text-white text-sm font-semibold mt-0.5">
                {col.floorBTC ? `${col.floorBTC} BTC` : "—"}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-600 text-[10px]">7d Volume</p>
            {loading ? (
              <div className="mt-0.5 h-4 w-20 bg-[#222] rounded animate-pulse" />
            ) : (
              <p className="text-white text-sm font-semibold mt-0.5">
                {col.volume7dBTC ? `${col.volume7dBTC} BTC` : "—"}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-600 text-[10px]">Supply</p>
            <p className="text-gray-300 text-sm mt-0.5">
              {col.supply ? col.supply.toLocaleString() : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-[10px]">Listed</p>
            <p className="text-gray-300 text-sm mt-0.5">
              {col.totalListed ? col.totalListed.toLocaleString() : "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1e1e1e] flex items-center justify-between">
          <span className="text-gray-600 text-[10px]">
            {col.owners ? `${col.owners.toLocaleString()} owners` : ""}
          </span>
          <span className="text-[#f7931a] text-[10px] font-medium group-hover:underline">
            View Activity →
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── List row ─────────────────────────────────────────────────────────────── */

function CollectionRow({
  col,
  rank,
  onClick,
}: {
  col: NftCollection;
  rank: number;
  onClick: () => void;
}) {
  const loading = col.floorBTC === undefined && col.network === "ordinals";
  const Skel = () => <div className="h-3 w-16 bg-[#222] rounded animate-pulse inline-block" />;

  return (
    <tr
      onClick={onClick}
      className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
    >
      <td className="py-3 px-4 text-gray-500 text-xs w-8">{rank}</td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <CollectionThumb col={col} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-medium text-sm group-hover:text-[#f7931a] transition-colors">
                {col.name}
              </p>
              {rank === 1 && (
                <span className="text-[9px] bg-[#f7931a] text-white px-1.5 py-0.5 rounded font-bold">
                  Featured
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <NetworkBadge network={col.network} />
              <span className="text-gray-600 text-[10px]">{col.category}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right font-semibold text-sm text-white">
        {loading ? <Skel /> : col.floorBTC ? `${col.floorBTC} BTC` : "—"}
      </td>
      <td className="py-3 px-3 text-right text-gray-300 text-sm">
        {loading ? <Skel /> : col.volume7dBTC ? `${col.volume7dBTC} BTC` : "—"}
      </td>
      <td className="py-3 px-3 text-right text-gray-400 text-sm">
        {col.supply?.toLocaleString() ?? "—"}
      </td>
      <td className="py-3 px-3 text-right text-gray-400 text-sm">
        {col.owners?.toLocaleString() ?? "—"}
      </td>
      <td className="py-3 px-3 text-right">
        {col.floorChange24h != null ? (
          <span
            className={`font-semibold text-sm ${
              col.floorChange24h >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {col.floorChange24h >= 0 ? "+" : ""}{col.floorChange24h.toFixed(1)}%
          </span>
        ) : (
          <span className="text-gray-600 text-sm">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-right text-gray-600 text-xs group-hover:text-[#f7931a] transition-colors">
        Activity →
      </td>
    </tr>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */

export default function NFTs() {
  const [collections, setCollections] = useState<NftCollection[]>(COLLECTIONS);
  const [view, setView]               = useState<"grid" | "list">("grid");
  const [selected, setSelected]       = useState<NftCollection | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Load live floor prices on mount
  useEffect(() => {
    setStatsLoading(true);
    enrichCollections(COLLECTIONS).then((enriched) => {
      setCollections(enriched);
      setStatsLoading(false);
    });
  }, []);

  const marketStats = computeMarketStats(collections);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <>
      {selected && <ActivityPanel col={selected} onClose={handleClose} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">NFTs</h1>
            <p className="text-gray-500 text-sm mt-1">
              Floor prices · Bitcoin Ordinals &amp; OPNet OP721 collections
            </p>
          </div>
          <div className="flex bg-[#161616] border border-[#222] rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "grid" ? "bg-[#f7931a] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "list" ? "bg-[#f7931a] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* Market stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Collections", value: marketStats.totalCollections.toString() },
            {
              label: "7d Volume",
              value: statsLoading ? null : marketStats.totalVolume7d,
            },
            {
              label: "Total Listed",
              value: statsLoading ? null : marketStats.totalListed > 0
                ? marketStats.totalListed.toLocaleString()
                : "—",
            },
            {
              label: "Top Floor",
              value: statsLoading ? null : marketStats.topFloor,
            },
          ].map((s) => (
            <div key={s.label} className="bg-[#161616] border border-[#222] rounded-xl p-4">
              <p className="text-gray-500 text-xs">{s.label}</p>
              {s.value === null ? (
                <div className="mt-2 h-6 w-24 bg-[#222] rounded animate-pulse" />
              ) : (
                <p className="text-white text-xl font-bold mt-1">{s.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Motocat featured banner */}
        <div
          onClick={() => setSelected(collections[0])}
          className="relative rounded-xl border border-[#f7931a]/30 bg-gradient-to-r from-orange-950/40 to-yellow-950/10 p-5 cursor-pointer hover:border-[#f7931a]/60 hover:shadow-[0_0_30px_rgba(247,147,26,0.12)] transition-all overflow-hidden group"
        >
          <div className="absolute right-0 top-0 h-full w-48 flex items-center justify-center text-9xl opacity-10 pointer-events-none select-none pr-4">
            🏎
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f7931a] text-white">
                ★ Featured Collection
              </span>
              <NetworkBadge network="opnet" />
            </div>
            <h2 className="text-white text-xl font-bold group-hover:text-[#f7931a] transition-colors">
              Motocat Racing
            </h2>
            <p className="text-gray-400 text-sm mt-0.5 max-w-lg">
              High-octane racing cats living on Bitcoin via OPNet OP721 smart contracts.
              Click to explore all buy &amp; sell activity on-chain.
            </p>
            <div className="flex items-center gap-6 mt-3">
              {collections[0]?.floorBTC && (
                <div>
                  <p className="text-gray-600 text-[10px]">Floor</p>
                  <p className="text-[#f7931a] font-bold">{collections[0].floorBTC} BTC</p>
                </div>
              )}
              <div>
                <p className="text-gray-600 text-[10px]">Network</p>
                <p className="text-white font-semibold text-sm">OPNet Mainnet</p>
              </div>
              <div className="ml-auto text-[#f7931a] font-medium text-sm group-hover:underline">
                View Activity →
              </div>
            </div>
          </div>
        </div>

        {/* Collection grid / list */}
        {view === "grid" ? (
          <div className="grid grid-cols-3 gap-4">
            {collections.map((col, i) => (
              <CollectionCard
                key={col.slug}
                col={col}
                rank={i + 1}
                onClick={() => setSelected(col)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#161616] border border-[#222] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="pb-3 px-4 pt-4 text-gray-400 font-medium text-xs uppercase text-left w-8">#</th>
                  <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-left">Collection</th>
                  <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-right">Floor Price</th>
                  <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-right">7d Volume</th>
                  <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-right">Supply</th>
                  <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-right">Owners</th>
                  <th className="pb-3 px-3 pt-4 text-gray-400 font-medium text-xs uppercase text-right">24h Chg</th>
                  <th className="pb-3 px-4 pt-4 text-gray-400 font-medium text-xs uppercase text-right" />
                </tr>
              </thead>
              <tbody>
                {collections.map((col, i) => (
                  <CollectionRow
                    key={col.slug}
                    col={col}
                    rank={i + 1}
                    onClick={() => setSelected(col)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
