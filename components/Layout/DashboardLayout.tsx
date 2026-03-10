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

/** Tracks the latest search trigger so AddressProfile re-runs even for the same query */
interface SearchTrigger {
  query: string;
  key: number;
}

export default function DashboardLayout() {
  const [activeTab,     setActiveTab]     = useState<TabName>("Overview");
  const [searchTrigger, setSearchTrigger] = useState<SearchTrigger>({ query: "", key: 0 });

  const handleSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setSearchTrigger((prev) => ({ query: q, key: prev.key + 1 }));
    setActiveTab("Address Profile");
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
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <Header activeTab={activeTab} onSearch={handleSearch} />
      <main className="ml-[240px] mt-[60px] min-h-[calc(100vh-60px)] overflow-y-auto">
        <div className="p-6">{renderPage()}</div>
      </main>
    </div>
  );
}
