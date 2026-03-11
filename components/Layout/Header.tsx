"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { TabName } from "./Sidebar";
import { useWallet } from "@/hooks/useWallet";

/* ── Search helpers ──────────────────────────────────────────────────────── */

type SearchType = "btc-address" | "opnet-address" | "tx-hash" | "unknown" | null;

function detectSearchType(q: string): SearchType {
  const s = q.trim();
  if (!s || s.length < 6) return null;
  if (/^(bc1|1[a-zA-Z0-9]{24,33}|3[a-zA-Z0-9]{24,33})/.test(s)) return "btc-address";
  if (/^(opt1|tb1)/.test(s)) return "opnet-address";
  if (/^[0-9a-fA-F]{64}$/.test(s)) return "tx-hash";
  if (/^0x[0-9a-fA-F]{64}$/.test(s)) return "tx-hash";
  return "unknown";
}

const TYPE_META: Record<Exclude<SearchType, null>, { label: string; icon: string; color: string }> = {
  "btc-address":   { label: "BTC Mainnet Address",       icon: "₿",  color: "text-[#f7931a]" },
  "opnet-address": { label: "OPNet Testnet Address",      icon: "⬡",  color: "text-purple-400" },
  "tx-hash":       { label: "Transaction Hash → OPScan", icon: "🔗", color: "text-cyan-400" },
  "unknown":       { label: "Unknown format",             icon: "?",  color: "text-gray-500" },
};

/* ── Network / wallet helpers ────────────────────────────────────────────── */

const MAINNET_CFG = { label: "Bitcoin Mainnet", dot: "bg-orange-400", border: "border-[#f7931a44]", text: "text-orange-300" };
const TESTNET_CFG = { label: "OPNet Testnet",   dot: "bg-purple-400", border: "border-[#7b3fe444]", text: "text-purple-300"  };

function getNetworkConfig(networkName: string | null | undefined) {
  if (!networkName) return TESTNET_CFG;
  const n = networkName.toLowerCase();
  if (n === "mainnet" || n === "livenet" || n === "bitcoin") return MAINNET_CFG;
  return TESTNET_CFG;
}

function shortAddr(addr: string) { return `${addr.slice(0, 5)}…${addr.slice(-4)}`; }
function formatBtc(sats: number)  { return (sats / 1e8).toFixed(4) + " BTC"; }

/* ── Props ───────────────────────────────────────────────────────────────── */

interface HeaderProps {
  activeTab: TabName;
  onSearch: (query: string) => void;
  onMenuOpen: () => void;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function Header({ activeTab, onSearch, onMenuOpen }: HeaderProps) {
  const [query,         setQuery]         = useState("");
  const [focused,       setFocused]       = useState(false);
  const [searchOverlay, setSearchOverlay] = useState(false);
  const inputRef        = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);

  const { walletAddress, walletBalance, network, connecting, openConnectModal, disconnect, walletType } = useWallet();

  const isConnected = !!walletAddress;
  const netCfg      = getNetworkConfig(network?.network);
  const searchType  = detectSearchType(query);

  const handleSubmit = useCallback((q?: string) => {
    const val = (q ?? query).trim();
    if (!val) return;
    const t = detectSearchType(val);
    if (t === "tx-hash") {
      window.open(`https://opscan.org/?network=op_testnet&tx=${val}`, "_blank");
    } else {
      onSearch(val);
    }
    setQuery("");
    setFocused(false);
    setSearchOverlay(false);
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") { setFocused(false); setSearchOverlay(false); }
  };

  // Open overlay and focus its input
  const openSearch = () => {
    setSearchOverlay(true);
    setTimeout(() => overlayInputRef.current?.focus(), 50);
  };

  // Close dropdown on outside click (desktop)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest(".search-wrapper")?.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = focused && query.trim().length >= 3;

  return (
    <>
      {/* ── Full-screen search overlay (mobile) ── */}
      {searchOverlay && (
        <div className="fixed inset-0 z-50 bg-[#0d0d0d] flex flex-col lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#222]">
            <button
              onClick={() => setSearchOverlay(false)}
              className="w-10 h-10 flex items-center justify-center text-gray-400 flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              ref={overlayInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="BTC address, OPNet address, TX hash…"
              className="flex-1 bg-transparent text-gray-200 placeholder-gray-600 text-base focus:outline-none py-2"
              autoCapitalize="none"
              autoCorrect="off"
            />
            {query && (
              <button onClick={() => setQuery("")} className="w-8 h-8 flex items-center justify-center text-gray-500">✕</button>
            )}
          </div>

          {/* Search hints */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {query.trim().length >= 3 && searchType && searchType !== "unknown" ? (
              <button
                onClick={() => handleSubmit(query)}
                className="w-full flex items-center gap-3 px-4 py-4 bg-[#161616] border border-[#2a2a2a] rounded-xl active:bg-[#1e1e1e] transition-colors text-left"
              >
                <span className={`text-2xl ${TYPE_META[searchType].color}`}>{TYPE_META[searchType].icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${TYPE_META[searchType].color}`}>{TYPE_META[searchType].label}</p>
                  <p className="text-gray-600 text-xs font-mono truncate mt-0.5">
                    {query.length > 30 ? query.slice(0, 16) + "…" + query.slice(-10) : query}
                  </p>
                </div>
                <span className="ml-auto text-gray-600 text-xs flex-shrink-0">
                  {searchType === "tx-hash" ? "OPScan ↗" : "Search →"}
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">Supported formats</p>
                {[
                  { icon: "₿", color: "text-[#f7931a]", label: "BTC Address", hint: "bc1q… / 1… / 3…" },
                  { icon: "⬡", color: "text-purple-400", label: "OPNet Address", hint: "opt1…" },
                  { icon: "⛓", color: "text-cyan-400",   label: "TX Hash", hint: "64 hex chars → opens OPScan" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 px-4 py-3 bg-[#161616] border border-[#1e1e1e] rounded-xl">
                    <span className={`text-xl ${s.color}`}>{s.icon}</span>
                    <div>
                      <p className="text-gray-300 text-sm font-medium">{s.label}</p>
                      <p className="text-gray-600 text-xs font-mono">{s.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="p-4 border-t border-[#1e1e1e]">
            <button
              onClick={() => handleSubmit()}
              disabled={!query.trim()}
              className="w-full py-3.5 bg-[#f7931a] hover:bg-[#e8840f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {/* ── Header bar ── */}
      <header className="fixed top-0 left-0 lg:left-[240px] right-0 h-[56px] lg:h-[60px] bg-[#0d0d0d] border-b border-[#1e1e1e] flex items-center justify-between px-3 lg:px-6 z-20 gap-2">

        {/* ── Mobile: hamburger ── */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-400 active:text-white flex-shrink-0 rounded-lg"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* ── Page title (desktop) / tab name (mobile) ── */}
        <div className="hidden lg:flex items-center gap-3 min-w-0">
          <div>
            <p className="text-white font-semibold text-sm leading-none">{activeTab}</p>
            <p className="text-gray-600 text-xs mt-0.5">OPNet Bitcoin L1</p>
          </div>
        </div>

        {/* Mobile page title */}
        <p className="lg:hidden text-white font-semibold text-sm flex-1 min-w-0 truncate">{activeTab}</p>

        {/* ── Right side ── */}
        <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">

          {/* Mobile: search icon button */}
          <button
            onClick={openSearch}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-400 active:text-white rounded-lg"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Desktop: full search bar */}
          <div className="relative search-wrapper hidden lg:block">
            <div
              className={`flex items-center gap-2 bg-[#161616] border rounded-xl transition-all duration-200 ${
                focused
                  ? "border-[#f7931a66] shadow-[0_0_0_3px_rgba(247,147,26,0.08)] w-80"
                  : "border-[#2a2a2a] w-64"
              }`}
            >
              <span className="pl-3 text-gray-500 text-sm flex-shrink-0">
                {searchType === "btc-address"   ? <span className="text-[#f7931a]">₿</span>
                : searchType === "opnet-address" ? <span className="text-purple-400">⬡</span>
                : searchType === "tx-hash"       ? <span className="text-cyan-400">⛓</span>
                : "⌕"}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search address or tx hash…"
                className="flex-1 bg-transparent py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none min-w-0"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="pr-1 text-gray-600 transition-colors flex-shrink-0 text-xs"
                >✕</button>
              )}
              <button
                onClick={() => handleSubmit()}
                disabled={!query.trim()}
                className="mr-1 px-2.5 py-1 rounded-lg bg-[#f7931a] hover:bg-[#e8840f] disabled:opacity-0 disabled:pointer-events-none text-white text-xs font-semibold transition-all flex-shrink-0"
              >
                Go
              </button>
            </div>

            {showDropdown && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden z-50">
                {searchType && searchType !== "unknown" ? (
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleSubmit(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e1e] transition-colors text-left"
                  >
                    <span className={`text-base ${TYPE_META[searchType].color}`}>{TYPE_META[searchType].icon}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${TYPE_META[searchType].color}`}>{TYPE_META[searchType].label}</p>
                      <p className="text-gray-600 text-[10px] font-mono truncate mt-0.5">
                        {query.length > 40 ? query.slice(0, 20) + "…" + query.slice(-12) : query}
                      </p>
                    </div>
                    <span className="ml-auto text-gray-600 text-[10px] flex-shrink-0">
                      {searchType === "tx-hash" ? "Opens OPScan ↗" : "Search ↵"}
                    </span>
                  </button>
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-gray-600 text-xs">Supported: BTC (bc1…), OPNet (opt1…), TX (64 hex)</p>
                  </div>
                )}
                <div className="border-t border-[#1e1e1e] px-4 py-2 flex items-center gap-3">
                  <span className="text-gray-700 text-[10px]">Quick:</span>
                  {["bc1q…", "opt1…", "64 hex"].map((h) => (
                    <span key={h} className="text-[10px] text-gray-600 bg-[#111] px-2 py-0.5 rounded font-mono">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop: network badge */}
          {isConnected && (
            <span className={`hidden lg:flex items-center gap-2 bg-[#161616] border ${netCfg.border} rounded-lg px-3 py-1.5 select-none`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${netCfg.dot}`} />
              <span className={`text-xs font-semibold ${netCfg.text}`}>{netCfg.label}</span>
            </span>
          )}

          {/* Desktop: balance */}
          {isConnected && walletBalance && (
            <div className="hidden lg:block bg-[#161616] border border-[#222] rounded-lg px-3 py-1.5">
              <span className="text-gray-500 text-xs">Balance </span>
              <span className="text-[#f7931a] text-xs font-mono font-semibold">{formatBtc(walletBalance.confirmed)}</span>
            </div>
          )}

          {/* Wallet — connected state */}
          {isConnected && walletAddress ? (
            <div className="flex items-center gap-1">
              {/* Compact pill */}
              <div className={`flex items-center gap-1.5 bg-[#161616] border ${netCfg.border} rounded-lg px-2.5 py-1.5`}>
                <span className="text-xs leading-none">
                  {walletType === "OP_WALLET" ? "⬡" : walletType === "UNISAT" ? "🟠" : "◉"}
                </span>
                <span className={`${netCfg.text} text-xs font-mono font-semibold`}>
                  {shortAddr(walletAddress)}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              </div>
              {/* Disconnect */}
              <button
                onClick={disconnect}
                title="Disconnect wallet"
                className="w-9 h-9 flex items-center justify-center bg-[#161616] border border-[#222] active:border-red-500/40 active:text-red-400 text-gray-500 rounded-lg transition-all text-sm"
              >
                ⏻
              </button>
            </div>
          ) : (
            /* Connect button */
            <button
              onClick={openConnectModal}
              disabled={connecting}
              className="flex items-center gap-2 bg-gradient-to-r from-[#f7931a] to-[#e8840f] active:from-[#e8840f] active:to-[#d4750e] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 lg:px-4 rounded-lg transition-all shadow-[0_0_12px_rgba(247,147,26,0.25)] min-h-[36px]"
            >
              {connecting ? (
                <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Connecting…</span></>
              ) : (
                <><span>◉</span><span className="hidden sm:inline"> Connect Wallet</span></>
              )}
            </button>
          )}
        </div>
      </header>
    </>
  );
}
