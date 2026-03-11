"use client";

import React, { useState, useEffect } from "react";
import Table from "../ui/Table";
import { useAddressData } from "../../hooks/useAddressData";
import { detectAddressType } from "../../lib/addressLookup";
import type { TxRecord } from "../../lib/addressLookup";
import type { TokenHolding, NftHolding } from "../../lib/tokenHoldings";

/* ── Demo addresses ── */
const DEMO_BTC   = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
const DEMO_OPNET = "opt1pm47v738p0qg5zcv5llxdzgzwhycca4fmz0d5arn7q5gxtuqt3aqq5zawhg";

/* ── TX Table ── */
type TxRow = TxRecord & Record<string, unknown>;

const txColumns = [
  {
    key: "shortHash", label: "TX Hash",
    render: (row: TxRow) => <span className="font-mono text-xs text-gray-300">{row.shortHash}</span>,
  },
  {
    key: "type", label: "Type",
    render: (row: TxRow) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
        row.type === "Receive"     ? "bg-green-500/10 text-green-400"
        : row.type === "Send"     ? "bg-red-500/10 text-red-400"
        : row.type === "Interaction" ? "bg-blue-500/10 text-blue-400"
        : "bg-gray-500/10 text-gray-400"
      }`}>{row.type}</span>
    ),
  },
  {
    key: "amountDisplay", label: "Amount", align: "right" as const,
    render: (row: TxRow) => (
      <span className={`font-mono text-sm font-medium ${row.amountSats >= 0 ? "text-green-400" : "text-red-400"}`}>
        {row.amountDisplay}
      </span>
    ),
  },
  {
    key: "counterparty", label: "Counterparty",
    render: (row: TxRow) => <span className="font-mono text-xs text-gray-400">{row.counterparty}</span>,
  },
  {
    key: "date", label: "Date",
    render: (row: TxRow) => <span className="text-xs text-gray-400">{row.date}</span>,
  },
  {
    key: "feeDisplay", label: "Fee", align: "right" as const,
    render: (row: TxRow) => <span className="font-mono text-xs text-gray-500">{row.feeDisplay}</span>,
  },
  {
    key: "status", label: "Status", align: "center" as const,
    render: (row: TxRow) => (
      <span className={row.status === "Confirmed" ? "text-green-400 text-xs" : "text-yellow-400 text-xs"}>
        {row.status === "Confirmed" ? "✓ Confirmed" : "⏳ Pending"}
      </span>
    ),
  },
];

/* ── Loading skeleton ── */
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#222]" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-[#222] rounded" />
              <div className="h-4 w-72 bg-[#222] rounded" />
              <div className="flex gap-2"><div className="h-5 w-24 bg-[#222] rounded" /><div className="h-5 w-24 bg-[#222] rounded" /></div>
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="h-3 w-14 bg-[#222] rounded ml-auto" />
            <div className="h-8 w-36 bg-[#222] rounded ml-auto" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5 pt-5 border-t border-[#222]">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-[#111] rounded-lg p-3 space-y-2">
              <div className="h-3 w-20 bg-[#222] rounded" />
              <div className="h-4 w-14 bg-[#222] rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Holdings skeletons */}
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(i => (
          <div key={i} className="bg-[#161616] border border-[#222] rounded-xl p-5">
            <div className="h-4 w-32 bg-[#222] rounded mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1,2,3].map(j => <div key={j} className="h-20 bg-[#111] rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Holdings skeleton (while holdings load after address data) ── */
function HoldingsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {[1,2].map(i => (
        <div key={i} className="bg-[#161616] border border-[#222] rounded-xl p-5">
          <div className="h-4 w-32 bg-[#222] rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1,2,3].map(j => <div key={j} className="h-20 bg-[#111] rounded-lg" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Token Holdings card ── */
function TokenCard({ token }: { token: TokenHolding }) {
  const letter = token.symbol[0]?.toUpperCase() ?? '?';
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-4 hover:border-[#f7931a33] transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f7931a] to-[#7b3fe4] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">{letter}</span>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{token.symbol}</p>
          <p className="text-gray-500 text-xs truncate">{token.name}</p>
        </div>
      </div>
      <p className="text-orange-400 font-mono text-sm font-medium break-all">{token.balanceDisplay}</p>
      <p className="text-gray-600 text-xs mt-1 font-mono truncate">{token.contractAddress.slice(0, 18)}…</p>
    </div>
  );
}

/* ── NFT Holdings card ── */
function NftCard({ nft }: { nft: NftHolding }) {
  const shapes = ['◆', '⬡', '⬢', '◉', '▲', '★'];
  const shape = shapes[parseInt(nft.contractAddress.slice(2, 4), 16) % shapes.length];
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-4 hover:border-[#7b3fe433] transition-colors">
      <div
        className="w-full h-20 rounded-lg mb-3 flex items-center justify-center text-3xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, #7b3fe433, #111)`,
        }}
      >
        {shape}
      </div>
      <p className="text-white text-sm font-semibold truncate">{nft.name}</p>
      <p className="text-gray-500 text-xs">{nft.symbol}</p>
      <p className="text-purple-400 font-mono text-sm font-medium mt-1">
        {nft.count.toString()} NFT{nft.count !== 1n ? 's' : ''}
      </p>
    </div>
  );
}

/* ── Token/NFT sections ── */
function HoldingsSections({
  tokens,
  nfts,
  loading,
  isBtc,
}: {
  tokens: TokenHolding[];
  nfts: NftHolding[];
  loading: boolean;
  isBtc: boolean;
}) {
  if (loading) return <HoldingsSkeleton />;

  const hasTokens = tokens.length > 0;
  const hasNfts   = nfts.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ── Token Holdings ── */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Token Holdings</h3>
          <span className="text-xs text-gray-500">
            {hasTokens ? `${tokens.length} token${tokens.length !== 1 ? 's' : ''}` : 'OP20'}
          </span>
        </div>
        {hasTokens ? (
          <div className="grid grid-cols-2 gap-3">
            {tokens.map(t => <TokenCard key={t.contractAddress} token={t} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-3xl mb-2 opacity-30">🪙</p>
            <p className="text-gray-500 text-sm">No OP20 tokens found</p>
            <p className="text-gray-600 text-xs mt-1">
              {isBtc
                ? "This address holds no OPNet tokens on mainnet"
                : "No OP20 token interactions in mempool"}
            </p>
          </div>
        )}
      </div>

      {/* ── NFT Holdings ── */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">NFT Holdings</h3>
          <span className="text-xs text-gray-500">
            {hasNfts ? `${nfts.length} collection${nfts.length !== 1 ? 's' : ''}` : 'OP721'}
          </span>
        </div>
        {hasNfts ? (
          <div className="grid grid-cols-2 gap-3">
            {nfts.map(n => <NftCard key={n.contractAddress} nft={n} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-3xl mb-2 opacity-30">🖼️</p>
            <p className="text-gray-500 text-sm">No OP721 NFTs found</p>
            <p className="text-gray-600 text-xs mt-1">
              {isBtc
                ? "This address holds no OPNet NFTs on mainnet"
                : "No OP721 NFT interactions in mempool"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ── */
interface SearchTrigger {
  query: string;
  key: number;
}

export default function AddressProfile({ searchTrigger }: { searchTrigger?: SearchTrigger }) {
  const [input, setInput] = useState(searchTrigger?.query ?? "");
  const { data, tokens, nfts, loading, loadingHoldings, error, search, reset } = useAddressData();

  const previewType =
    input.trim().length > 8 ? detectAddressType(input.trim()) : null;

  const handleSearch = () => { if (input.trim()) search(input.trim()); };

  const loadDemo = (addr: string) => { setInput(addr); search(addr); };

  // Auto-fire when DashboardLayout triggers a search from the header
  useEffect(() => {
    if (searchTrigger?.query) {
      setInput(searchTrigger.query);
      search(searchTrigger.query);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrigger?.key]);

  const isBtc   = data?.addressType === "btc-mainnet";
  const isOpNet = data?.addressType === "opnet-testnet";

  const usdValue = data
    ? (data.balanceSats / 1e8 * 63000).toLocaleString("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: 0,
      })
    : "$0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Address Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Look up any Bitcoin mainnet or OPNet testnet address
        </p>
      </div>

      {/* ── Search box ── */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
        <label className="text-gray-400 text-sm font-medium block mb-3">
          Bitcoin / OPNet Address
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="bc1q… (BTC mainnet)  or  opt1… (OPNet testnet)"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2.5 pr-36 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#f7931a55] font-mono"
            />
            {previewType && previewType !== "unknown" && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded font-medium pointer-events-none ${
                previewType === "btc-mainnet"
                  ? "bg-orange-500/10 text-orange-400"
                  : "bg-purple-500/10 text-purple-400"
              }`}>
                {previewType === "btc-mainnet" ? "₿ BTC Mainnet" : "⬡ OPNet Testnet"}
              </span>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !input.trim()}
            className="bg-[#f7931a] hover:bg-[#e8840f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Loading
              </span>
            ) : "Search"}
          </button>
          <button onClick={() => loadDemo(DEMO_BTC)} disabled={loading}
            className="bg-[#1a1a1a] hover:bg-[#222] border border-[#f7931a33] text-orange-400 hover:text-orange-300 text-xs px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap">
            Demo BTC
          </button>
          <button onClick={() => loadDemo(DEMO_OPNET)} disabled={loading}
            className="bg-[#1a1a1a] hover:bg-[#222] border border-[#7b3fe433] text-purple-400 hover:text-purple-300 text-xs px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap">
            Demo OPNet
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-400 text-lg leading-none mt-0.5">⚠</span>
          <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && <Skeleton />}

      {/* ── Results ── */}
      {data && !loading && (
        <>
          {/* Profile card */}
          <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
            <div className="flex items-start gap-4 justify-between flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isBtc
                    ? "bg-gradient-to-br from-[#f7931a] to-[#e05c00]"
                    : "bg-gradient-to-br from-[#7b3fe4] to-[#4a1fa0]"
                }`}>
                  <span className="text-white text-2xl font-black">{isBtc ? "₿" : "⬡"}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-500 text-xs mb-1">Address</p>
                  <p className="text-white font-mono text-sm break-all leading-relaxed">{data.address}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {isBtc && (
                      <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded font-medium">
                        ₿ Bitcoin Mainnet
                      </span>
                    )}
                    {isOpNet && (
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded font-medium">
                        ⬡ OPNet Testnet
                      </span>
                    )}
                    {data.isOpNetEnabled && isBtc && (
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded font-medium">
                        OP_NET Active
                      </span>
                    )}
                    {tokens.length > 0 && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded font-medium">
                        {tokens.length} Token{tokens.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {nfts.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded font-medium">
                        {nfts.length} NFT Collection{nfts.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="text-right flex-shrink-0">
                <p className="text-gray-500 text-xs mb-1">Balance</p>
                <p className="text-white text-2xl font-bold font-mono">
                  {data.balanceBTC} <span className="text-sm text-gray-400">BTC</span>
                </p>
                {isBtc && <p className="text-gray-500 text-sm mt-0.5">≈ {usdValue}</p>}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#222]">
              {[
                { label: "Total Transactions",   value: data.txCount > 0 ? data.txCount.toLocaleString() : "—" },
                { label: isBtc ? "UTXOs" : "Pending TXs", value: isBtc ? data.utxoCount.toLocaleString() : data.transactions.length.toLocaleString() },
                { label: "Tokens Held",          value: loadingHoldings ? "…" : tokens.length.toLocaleString() },
                { label: "NFT Collections",      value: loadingHoldings ? "…" : nfts.length.toLocaleString() },
              ].map(s => (
                <div key={s.label} className="bg-[#111] rounded-lg p-3">
                  <p className="text-gray-500 text-xs">{s.label}</p>
                  <p className="text-white font-semibold text-sm mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Token + NFT Holdings */}
          <HoldingsSections
            tokens={tokens}
            nfts={nfts}
            loading={loadingHoldings}
            isBtc={!!isBtc}
          />

          {/* OPNet info banner */}
          {isOpNet && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3">
              <span className="text-purple-400 text-xl">⬡</span>
              <div>
                <p className="text-purple-300 text-sm font-medium">OPNet Testnet Address</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Token &amp; NFT balances are queried from contracts discovered in this address's pending
                  transaction history via <span className="font-mono text-gray-400">btc_call</span>.
                </p>
              </div>
            </div>
          )}

          {/* Transaction history */}
          <div className="bg-[#161616] border border-[#222] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-white font-semibold">
                {isOpNet ? "Pending Transactions" : "Transaction History"}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">
                  Showing {data.transactions.length}
                  {data.txCount > data.transactions.length ? ` of ${data.txCount.toLocaleString()}` : ""}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                  isBtc
                    ? "bg-orange-500/10 text-orange-400"
                    : "bg-purple-500/10 text-purple-400"
                }`}>
                  {isBtc ? "via mempool.space" : "via OPNet RPC"}
                </span>
              </div>
            </div>

            {data.transactions.length > 0 ? (
              <Table<TxRow> columns={txColumns} data={data.transactions as TxRow[]} />
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-3 opacity-30">📭</p>
                <p className="text-gray-500 text-sm">No transactions found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {!data && !loading && !error && (
        <div className="bg-[#161616] border border-[#222] rounded-xl p-16 text-center">
          <p className="text-5xl mb-5 opacity-60">◉</p>
          <p className="text-gray-300 text-lg font-medium mb-4">Enter an address to explore</p>
          <div className="inline-grid grid-cols-2 gap-4 text-left mt-2">
            <div className="bg-[#111] rounded-lg px-4 py-3 border border-[#f7931a22]">
              <p className="text-orange-400 text-xs font-semibold mb-1">₿ Bitcoin Mainnet</p>
              <p className="text-gray-500 text-xs font-mono">bc1q… / bc1p… / 1… / 3…</p>
              <p className="text-gray-600 text-xs mt-1">Balance · UTXOs · txs · OP20 tokens · NFTs</p>
            </div>
            <div className="bg-[#111] rounded-lg px-4 py-3 border border-[#7b3fe422]">
              <p className="text-purple-400 text-xs font-semibold mb-1">⬡ OPNet Testnet</p>
              <p className="text-gray-500 text-xs font-mono">opt1…</p>
              <p className="text-gray-600 text-xs mt-1">Balance · pending txs · OP20 tokens · NFTs</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
