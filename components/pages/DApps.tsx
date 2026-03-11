"use client";

import React, { useState, useMemo } from "react";
import {
  PROJECTS,
  ALL_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  EcoCategory,
  EcoProject,
} from "../../lib/ecosystemData";

const STATUS_STYLE: Record<string, string> = {
  Live:     'bg-green-500/10 text-green-400 border border-green-500/20',
  Beta:     'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Building: 'bg-gray-500/10 text-gray-500 border border-gray-500/20',
};

function DAppCard({ project }: { project: EcoProject }) {
  const color = CATEGORY_COLORS[project.category];
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#161616] border border-[#222] rounded-xl p-5 hover:border-[#333] hover:shadow-[0_0_18px_rgba(247,147,26,0.09)] transition-all duration-200 cursor-pointer group flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {project.icon}
          </div>
          <div>
            <p className="text-white font-semibold text-sm group-hover:text-[#f7931a] transition-colors leading-tight">
              {project.name}
            </p>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {project.category}
            </span>
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[project.status]}`}>
          {project.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-3">{project.description}</p>

      {/* Tags + link */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1e1e1e]">
        <div className="flex flex-wrap gap-1">
          {project.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded border border-[#2a2a2a] text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-[#f7931a] text-[10px] font-medium group-hover:underline flex-shrink-0 ml-2">
          Open ↗
        </span>
      </div>
    </a>
  );
}

type FilterType = 'All' | EcoCategory;

export default function DApps() {
  const [filter, setFilter]   = useState<FilterType>('All');
  const [search, setSearch]   = useState('');

  const filtered = useMemo(() => {
    let list = filter === 'All' ? PROJECTS : PROJECTS.filter((p) => p.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [filter, search]);

  const cats: FilterType[] = ['All', ...ALL_CATEGORIES];

  const catCount = (cat: EcoCategory) => PROJECTS.filter((p) => p.category === cat).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">dApps</h1>
          <p className="text-gray-500 text-sm mt-1">
            Verified decentralized applications on OPNet Bitcoin L1
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right bg-[#161616] border border-[#222] rounded-lg px-4 py-2">
            <p className="text-gray-500 text-[10px]">Verified dApps</p>
            <p className="text-[#f7931a] font-bold text-lg">{PROJECTS.length}</p>
          </div>
          <div className="text-right bg-[#161616] border border-[#222] rounded-lg px-4 py-2">
            <p className="text-gray-500 text-[10px]">Total Ecosystem</p>
            <p className="text-white font-bold text-lg">329</p>
          </div>
        </div>
      </div>

      {/* Category stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ALL_CATEGORIES.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const icon  = CATEGORY_ICONS[cat];
          return (
            <div
              key={cat}
              onClick={() => setFilter(filter === cat ? 'All' : cat)}
              className={`bg-[#161616] border rounded-xl p-3 cursor-pointer transition-all hover:border-[#333] ${
                filter === cat ? 'border-[#f7931a33] shadow-[0_0_14px_rgba(247,147,26,0.1)]' : 'border-[#222]'
              }`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-base mb-2"
                style={{ backgroundColor: `${color}18`, color }}
              >
                {icon}
              </div>
              <p className="text-white text-xs font-semibold leading-tight">{cat}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{catCount(cat)} dApps</p>
            </div>
          );
        })}
      </div>

      {/* Filter + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {cats.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === cat
                  ? 'bg-[#f7931a] text-white shadow-[0_0_10px_rgba(247,147,26,0.25)]'
                  : 'bg-[#161616] border border-[#222] text-gray-400 hover:text-white hover:border-[#333]'
              }`}
            >
              {cat === 'All' ? `All (${PROJECTS.length})` : cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dApps..."
          className="ml-auto bg-[#161616] border border-[#222] rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#f7931a44] w-44"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No dApps match your search.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <DAppCard key={p.name} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
