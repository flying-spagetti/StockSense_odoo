"use client";

import React from "react";
import { SearchIcon, XIcon, FilterIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";

export interface SmartFilterValues {
  search: string;
  category?: string;
  stockStatus?: string;
  location?: string;
  kind?: string;
  status?: string;
}

interface SmartFilterBarProps {
  values: SmartFilterValues;
  onChange: (newValues: SmartFilterValues) => void;
  categories?: string[];
  locations?: string[];
  showCategoryFilter?: boolean;
  showStockStatusFilter?: boolean;
  showLocationFilter?: boolean;
  showKindFilter?: boolean;
  showStatusFilter?: boolean;
  placeholder?: string;
}

export function SmartFilterBar({
  values,
  onChange,
  categories = ["Apparel", "Homeware", "Electronics", "Stationery"],
  locations = [
    "Main Warehouse",
    "Warehouse 1",
    "Warehouse 2",
    "Production Floor",
    "Packaging Zone",
    "WH/Stock",
    "Rack A",
    "Rack B",
    "SF/Stock",
    "SF/Receiving",
  ],
  showCategoryFilter = true,
  showStockStatusFilter = true,
  showLocationFilter = false,
  showKindFilter = false,
  showStatusFilter = true,
  placeholder = "Search by SKU or product name...",
}: SmartFilterBarProps) {
  const hasActiveFilters =
    Boolean(values.search) ||
    (values.category && values.category !== "all") ||
    (values.stockStatus && values.stockStatus !== "all") ||
    (values.location && values.location !== "all") ||
    (values.kind && values.kind !== "all") ||
    (values.status && values.status !== "all");

  const handleClear = () => {
    onChange({
      search: "",
      category: "all",
      stockStatus: "all",
      location: "all",
      kind: "all",
      status: "all",
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800 shadow-sm backdrop-blur-sm">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
        <Input
          type="text"
          placeholder={placeholder}
          value={values.search}
          onChange={(e) => onChange({ ...values, search: e.target.value })}
          className="pl-9 bg-zinc-950 border-zinc-700 focus:border-amber-500 font-sans text-xs"
        />
        {values.search && (
          <button
            type="button"
            onClick={() => onChange({ ...values, search: "" })}
            className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Smart Filters Group */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        {/* Category Filter */}
        {showCategoryFilter && (
          <select
            value={values.category || "all"}
            onChange={(e) => onChange({ ...values, category: e.target.value })}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-200 outline-none focus:border-amber-500 font-sans"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        {/* Stock Status Filter */}
        {showStockStatusFilter && (
          <select
            value={values.stockStatus || "all"}
            onChange={(e) => onChange({ ...values, stockStatus: e.target.value })}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-200 outline-none focus:border-amber-500 font-sans"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt;0)</option>
            <option value="low_stock">Low Stock (≤ Reorder)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        )}

        {/* Location Filter */}
        {showLocationFilter && (
          <select
            value={values.location || "all"}
            onChange={(e) => onChange({ ...values, location: e.target.value })}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-200 outline-none focus:border-amber-500 font-sans"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        )}

        {/* Movement Kind Filter */}
        {showKindFilter && (
          <select
            value={values.kind || "all"}
            onChange={(e) => onChange({ ...values, kind: e.target.value })}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-200 outline-none focus:border-amber-500 font-sans"
          >
            <option value="all">All Movement Types</option>
            <option value="receipt">Receipt (Incoming)</option>
            <option value="issue">Delivery (Outgoing)</option>
            <option value="transfer">Transfer (Internal)</option>
            <option value="adjustment">Adjustment (Count)</option>
          </select>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <select
            value={values.status || "all"}
            onChange={(e) => onChange({ ...values, status: e.target.value })}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-200 outline-none focus:border-amber-500 font-sans"
          >
            <option value="all">All Document Statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="h-9 px-3 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-semibold flex items-center gap-1.5 transition"
          >
            <FilterIcon className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
