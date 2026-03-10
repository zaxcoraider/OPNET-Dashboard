"use client";

import React from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  className = "",
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#222]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`pb-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wide ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={`py-3 px-3 text-gray-200 ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {col.render
                    ? col.render(row)
                    : String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
