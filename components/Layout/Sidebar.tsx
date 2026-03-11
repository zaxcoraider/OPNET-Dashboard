"use client";

import React from "react";

export type TabName =
  | "Overview"
  | "Address Profile"
  | "Network Activity"
  | "dApps"
  | "Tokens"
  | "Smart Contracts"
  | "NFTs"
  | "DeFi"
  | "Ecosystem";

interface NavItem {
  name: TabName;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Overview",        icon: "⬡" },
  { name: "Address Profile", icon: "◉" },
  { name: "Network Activity",icon: "⚡" },
  { name: "dApps",           icon: "⬢" },
  { name: "Tokens",          icon: "◈" },
  { name: "Smart Contracts", icon: "⬟" },
  { name: "NFTs",            icon: "◆" },
  { name: "DeFi",            icon: "⬧" },
  { name: "Ecosystem",       icon: "◇" },
];

interface SidebarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  /** Mobile only — whether the drawer is slid open */
  drawerOpen: boolean;
  onDrawerClose: () => void;
}

export default function Sidebar({ activeTab, onTabChange, drawerOpen, onDrawerClose }: SidebarProps) {
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-[240px] bg-[#111111] border-r border-[#222]
        flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:z-30
      `}
    >
      {/* Logo + mobile close button */}
      <div className="px-4 py-4 border-b border-[#222] flex items-center justify-between">
        <button
          onClick={() => onTabChange("Overview")}
          className="focus:outline-none flex-1 flex justify-center"
          title="Go to Overview"
        >
          <img
            src="/logo.png"
            alt="OP Dashboard"
            className="h-16 w-auto object-contain select-none transition-opacity duration-150 active:opacity-70"
            draggable={false}
          />
        </button>
        {/* Close button — mobile only */}
        <button
          onClick={onDrawerClose}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white rounded-lg transition-colors flex-shrink-0 ml-2"
          aria-label="Close menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold px-2 mb-2">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <li key={item.name}>
                <button
                  onClick={() => onTabChange(item.name)}
                  className={`w-full flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px] ${
                    isActive
                      ? "bg-[#f7931a1a] text-[#f7931a] border border-[#f7931a33]"
                      : "text-gray-400 active:bg-[#1a1a1a] active:text-white"
                  }`}
                >
                  <span className={`text-base w-5 text-center flex-shrink-0 ${isActive ? "text-[#f7931a]" : "text-gray-500"}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f7931a] flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#222] space-y-2">
        <a
          href="https://opnet.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-gray-600 transition-colors group min-h-[36px]"
        >
          <span className="text-[#f7931a] text-sm">⬡</span>
          <span className="text-[11px] font-medium text-gray-500">Built on OPNet</span>
        </a>

        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-[11px]">Built by <span className="text-gray-400 font-medium">zax</span></span>
          <div className="flex items-center gap-2">
            <a
              href="https://x.com/zax_raider"
              target="_blank"
              rel="noopener noreferrer"
              title="@zax_raider on X"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-500 active:text-white active:border-[#444] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.836L1.254 2.25H8.08l4.261 5.638 5.902-5.638Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com/zaxcoraider"
              target="_blank"
              rel="noopener noreferrer"
              title="zaxcoraider on GitHub"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-500 active:text-white active:border-[#444] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
