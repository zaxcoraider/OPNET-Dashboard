"use client";

import React, { useState, useCallback } from "react";
import Sidebar, { TabName } from "./Sidebar";
import Header from "./Header";
import Overview from "../pages/Overview";
import AddressProfile from "../pages/AddressProfile";
import NetworkActivity from "../pages/NetworkActivity";
import DApps from "../pages/DApps";
import Tokens from "../pages/Tokens";
import SmartContracts from "../pages/SmartContracts";
import NFTs from "../pages/NFTs";
import DeFi from "../pages/DeFi";
import Ecosystem from "../pages/Ecosystem";

interface SearchTrigger {
  query: string;
  key: number;
}

/* ── Bottom nav tabs (mobile-only, 5 primary + "More") ─────────────────── */

const BOTTOM_TABS: { name: TabName; icon: string; label: string }[] = [
  { name: "Overview",        icon: "⬡", label: "Home"      },
  { name: "Address Profile", icon: "◉", label: "Address"   },
  { name: "NFTs",            icon: "◆", label: "NFTs"      },
  { name: "Smart Contracts", icon: "⬟", label: "Contracts" },
  { name: "DeFi",            icon: "⬧", label: "DeFi"      },
];

export default function DashboardLayout() {
  const [activeTab,      setActiveTab]      = useState<TabName>("Overview");
  const [searchTrigger,  setSearchTrigger]  = useState<SearchTrigger>({ query: "", key: 0 });
  const [drawerOpen,     setDrawerOpen]     = useState(false);

  const handleSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setSearchTrigger((prev) => ({ query: q, key: prev.key + 1 }));
    setActiveTab("Address Profile");
    setDrawerOpen(false);
  }, []);

  const handleTabChange = useCallback((tab: TabName) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case "Overview":          return <Overview />;
      case "Address Profile":   return <AddressProfile searchTrigger={searchTrigger} />;
      case "Network Activity":  return <NetworkActivity />;
      case "dApps":             return <DApps />;
      case "Tokens":            return <Tokens />;
      case "Smart Contracts":   return <SmartContracts />;
      case "NFTs":              return <NFTs />;
      case "DeFi":              return <DeFi />;
      case "Ecosystem":         return <Ecosystem />;
      default:                  return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">

      {/* ── Sidebar: hidden on mobile, fixed on lg+ ── */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        drawerOpen={drawerOpen}
        onDrawerClose={() => setDrawerOpen(false)}
      />

      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Header ── */}
      <Header
        activeTab={activeTab}
        onSearch={handleSearch}
        onMenuOpen={() => setDrawerOpen(true)}
      />

      {/* ── Main content ── */}
      <main className="lg:ml-[240px] mt-[56px] lg:mt-[60px] min-h-[calc(100vh-56px)] overflow-y-auto">
        {/* pb-20 reserves space above the mobile bottom nav */}
        <div className="p-4 lg:p-6 pb-24 lg:pb-6">
          {renderPage()}
        </div>
      </main>

      {/* ── Bottom nav bar (mobile only) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-[#111] border-t border-[#222] flex items-stretch safe-bottom">
        {BOTTOM_TABS.map((t) => {
          const isActive = activeTab === t.name;
          return (
            <button
              key={t.name}
              onClick={() => handleTabChange(t.name)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
                isActive ? "text-[#f7931a]" : "text-gray-500"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="text-[10px] font-medium leading-none">{t.label}</span>
              {isActive && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#f7931a]" />}
            </button>
          );
        })}
        {/* "More" opens full nav drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-gray-500 transition-colors"
        >
          <span className="text-lg leading-none">≡</span>
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>

    </div>
  );
}
