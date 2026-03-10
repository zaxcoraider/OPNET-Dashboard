"use client";

import React, { useState } from "react";
import {
  PROJECTS,
  ALL_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  EcoCategory,
  EcoProject,
  getByCategory,
} from "../../lib/ecosystemData";

const STATUS_DOT: Record<string, string> = {
  Live:     'bg-green-400',
  Beta:     'bg-yellow-400',
  Building: 'bg-gray-500',
};

function EcosystemCard({ item }: { item: EcoProject }) {
  const color = CATEGORY_COLORS[item.category];
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#161616] border border-[#222] rounded-xl p-4 hover:border-[#333] hover:shadow-[0_0_14px_rgba(247,147,26,0.07)] transition-all cursor-pointer group flex flex-col"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm group-hover:text-[#f7931a] transition-colors truncate">
              {item.name}
            </p>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[item.status]}`} title={item.status} />
          </div>
          <p className="text-gray-600 text-[10px] mt-0.5">{item.status} · {item.category}</p>
        </div>
      </div>
      <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-3">{item.description}</p>
      <div className="flex flex-wrap gap-1">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full border border-[#2a2a2a] text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
}

export default function Ecosystem() {
  const [filter, setFilter] = useState<'All' | EcoCategory>('All');

  const liveCount     = PROJECTS.filter((p) => p.status === 'Live').length;
  const betaCount     = PROJECTS.filter((p) => p.status === 'Beta').length;

  const displayProjects =
    filter === 'All' ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

  const grouped = ALL_CATEGORIES.reduce<Record<EcoCategory, EcoProject[]>>(
    (acc, cat) => { acc[cat] = getByCategory(cat); return acc; },
    {} as Record<EcoCategory, EcoProject[]>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Ecosystem</h1>
        <p className="text-gray-500 text-sm mt-1">
          The full verified OPNet Bitcoin L1 ecosystem — {PROJECTS.length} projects across {ALL_CATEGORIES.length} categories
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Projects',     value: PROJECTS.length.toString(),  sub: 'Verified by vibecode.finance' },
          { label: 'Live',               value: liveCount.toString(),         sub: 'In production' },
          { label: 'Beta / Building',    value: betaCount.toString(),         sub: 'In development' },
          { label: 'Categories',         value: ALL_CATEGORIES.length.toString(), sub: 'Project types' },
        ].map((s) => (
          <div key={s.label} className="bg-[#161616] border border-[#222] rounded-xl p-4">
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className="text-white text-xl font-bold mt-1">{s.value}</p>
            <p className="text-gray-600 text-[10px] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Category overview cards */}
      <div className="grid grid-cols-5 gap-3">
        {ALL_CATEGORIES.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const icon  = CATEGORY_ICONS[cat];
          const count = grouped[cat].length;
          const live  = grouped[cat].filter((p) => p.status === 'Live').length;
          return (
            <div
              key={cat}
              onClick={() => setFilter(filter === cat ? 'All' : cat)}
              className={`bg-[#161616] border rounded-xl p-4 cursor-pointer transition-all hover:border-[#333] ${
                filter === cat
                  ? 'border-[#f7931a33] shadow-[0_0_16px_rgba(247,147,26,0.1)]'
                  : 'border-[#222]'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg mb-2"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {icon}
              </div>
              <p className="text-white font-medium text-xs leading-tight">{cat}</p>
              <p className="text-gray-500 text-[10px] mt-1">{count} projects</p>
              <p className="text-green-400 text-[10px]">{live} live</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['All', ...ALL_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === cat
                ? 'bg-[#f7931a] text-white'
                : 'bg-[#161616] border border-[#222] text-gray-400 hover:text-white hover:border-[#333]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {filter === 'All' ? (
        <div className="space-y-8">
          {ALL_CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: CATEGORY_COLORS[cat] }} className="text-lg">
                  {CATEGORY_ICONS[cat]}
                </span>
                <h3 className="text-white font-semibold">{cat}</h3>
                <span className="text-gray-600 text-xs">({grouped[cat].length})</span>
                <span className="text-green-400 text-[10px]">
                  {grouped[cat].filter((p) => p.status === 'Live').length} live
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {grouped[cat].map((item) => (
                  <EcosystemCard key={item.name} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {displayProjects.map((item) => (
            <EcosystemCard key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
