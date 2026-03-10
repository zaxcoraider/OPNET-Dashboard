"use client";

import React from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`bg-[#161616] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-all duration-200 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-white font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
