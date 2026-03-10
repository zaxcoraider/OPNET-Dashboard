"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon?: React.ReactNode;
  accent?: "orange" | "purple";
}

export default function StatCard({
  title,
  value,
  change,
  changePositive = true,
  icon,
  accent = "orange",
}: StatCardProps) {
  const accentColor = accent === "orange" ? "#f7931a" : "#7b3fe4";
  const glowColor =
    accent === "orange"
      ? "hover:shadow-[0_0_20px_rgba(247,147,26,0.15)]"
      : "hover:shadow-[0_0_20px_rgba(123,63,228,0.15)]";

  return (
    <div
      className={`bg-[#161616] border border-[#222] rounded-xl p-5 transition-all duration-200 ${glowColor} hover:border-[#333] cursor-default`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>
      <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
      {change && (
        <p
          className={`text-sm mt-2 font-medium ${
            changePositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {changePositive ? "▲" : "▼"} {change}
        </p>
      )}
    </div>
  );
}
