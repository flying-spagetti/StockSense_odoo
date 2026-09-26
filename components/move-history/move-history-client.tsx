"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  MoveHistoryIcon,
  CheckCircleIcon,
  XIcon,
  FilterIcon,
} from "@/components/ui/icons";
import type { MoveHistoryRow } from "@/lib/db/queries";
import { SmartFilterBar } from "@/components/ui/smart-filter-bar";

interface MoveHistoryClientProps {
  movements: MoveHistoryRow[];
}

export function MoveHistoryClient({ movements }: MoveHistoryClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Extract unique locations from movements
  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    movements.forEach((m) => {
      if (m.fromLocationId) locSet.add(m.fromLocationId);
      if (m.toLocationId) locSet.add(m.toLocationId);
    });
    return Array.from(locSet).sort();
  }, [movements]);

  // Extract unique product categories
  const uniqueCategories = useMemo(() => {
    const catSet = new Set<string>();
    movements.forEach((m) => {
      if (m.productCategory) catSet.add(m.productCategory);
    });
    return Array.from(catSet).sort();
  }, [movements]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Search text
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.reference.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.productSku.toLowerCase().includes(q) ||
        (m.supplierOrCustomer && m.supplierOrCustomer.toLowerCase().includes(q)) ||
        (m.fromLocationId && m.fromLocationId.toLowerCase().includes(q)) ||
        (m.toLocationId && m.toLocationId.toLowerCase().includes(q));

      // Type filter
      let matchesType = true;
      if (typeFilter !== "all") {
        if (typeFilter === "receipt") matchesType = m.kind === "receipt";
        else if (typeFilter === "delivery") matchesType = m.kind === "issue";
        else if (typeFilter === "transfer") matchesType = m.kind === "transfer";
        else if (typeFilter === "adjustment") matchesType = m.kind === "adjustment";
      }

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== "all") {
        matchesStatus = m.status === statusFilter;
      }

      // Location filter
      let matchesLocation = true;
      if (locationFilter !== "all") {
        matchesLocation =
          m.fromLocationId === locationFilter || m.toLocationId === locationFilter;
      }

      // Category filter
      let matchesCategory = true;
      if (categoryFilter !== "all") {
        matchesCategory = m.productCategory === categoryFilter;
      }

      return matchesSearch && matchesType && matchesStatus && matchesLocation && matchesCategory;
    });
  }, [movements, search, typeFilter, statusFilter, locationFilter, categoryFilter]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MoveHistoryIcon className="h-6 w-6 text-indigo-400" />
            Stock Ledger
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Every validated inventory operation is recorded here.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Unified Movement Audit Ledger ({movements.length})</span>
        </div>
      </div>

      {/* Smart Filter Bar: SKU-search & Smart Filters */}
      <SmartFilterBar
        values={{
          search,
          category: categoryFilter,
          location: locationFilter,
          kind: typeFilter,
          status: statusFilter,
        }}
        onChange={(newVals) => {
          setSearch(newVals.search);
          setCategoryFilter(newVals.category || "all");
          setLocationFilter(newVals.location || "all");
          setTypeFilter(newVals.kind || "all");
          setStatusFilter(newVals.status || "all");
        }}
        categories={uniqueCategories}
        locations={uniqueLocations}
        showCategoryFilter={true}
        showStockStatusFilter={false}
        showLocationFilter={true}
        showKindFilter={true}
        showStatusFilter={true}
        placeholder="Search reference, SKU, product name, or location..."
      />

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium">Product</th>
                <th scope="col" className="px-4 py-3 font-medium">From</th>
                <th scope="col" className="px-4 py-3 font-medium">To</th>
                <th scope="col" className="px-4 py-3 font-medium">Quantity</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    No stock movements found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((move) => {
                  const isDone = move.status === "done";
                  const isMuted = move.status === "draft" || move.status === "canceled";

                  return (
                    <tr
                      key={move.id}
                      className={`transition-colors hover:bg-zinc-800/40 ${
                        isMuted ? "opacity-75 bg-zinc-950/40" : ""
                      }`}
                    >
                      {/* Date */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {formatDate(move.createdAt)}
                      </td>

                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-zinc-200">
                        {move.reference}
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5 text-xs font-mono">
                        {move.kind === "receipt" && (
                          <span className="inline-flex items-center rounded bg-emerald-500/10 px-2.5 py-0.5 text-emerald-400 font-bold border border-emerald-500/30">
                            Receipt
                          </span>
                        )}
                        {move.kind === "issue" && (
                          <span className="inline-flex items-center rounded bg-amber-500/10 px-2.5 py-0.5 text-amber-400 font-bold border border-amber-500/30">
                            Delivery
                          </span>
                        )}
                        {move.kind === "transfer" && (
                          <span className="inline-flex items-center rounded bg-sky-500/10 px-2.5 py-0.5 text-sky-400 font-bold border border-sky-500/30">
                            Transfer
                          </span>
                        )}
                        {move.kind === "adjustment" && (
                          <span className="inline-flex items-center rounded bg-purple-500/10 px-2.5 py-0.5 text-purple-300 font-bold border border-purple-500/30">
                            Adjustment
                          </span>
                        )}
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{move.productName}</div>
                        <div className="font-mono text-[11px] text-zinc-500">
                          {move.productSku} • <span className="text-zinc-400">{move.productCategory}</span>
                        </div>
                      </td>

                      {/* From */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        {move.fromLocationId ? (
                          <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800">
                            {move.fromLocationId}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* To */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        {move.toLocationId ? (
                          <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800">
                            {move.toLocationId}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold whitespace-nowrap">
                        {move.kind === "receipt" && (
                          <span className="text-emerald-400">+{move.quantity} {move.productUnit}</span>
                        )}
                        {move.kind === "issue" && (
                          <span className="text-amber-400">-{move.quantity} {move.productUnit}</span>
                        )}
                        {move.kind === "transfer" && (
                          <span className="text-sky-300">{move.quantity} {move.productUnit}</span>
                        )}
                        {move.kind === "adjustment" && (
                          <span className={move.signedQuantity > 0 ? "text-emerald-400" : "text-amber-400"}>
                            {move.signedQuantity > 0 ? `+${move.signedQuantity}` : move.signedQuantity} {move.productUnit}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-xs font-mono whitespace-nowrap">
                        {move.status === "done" && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-bold border border-emerald-500/30">
                            <CheckCircleIcon className="h-3 w-3" /> Done
                          </span>
                        )}
                        {move.status === "draft" && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-amber-300 font-bold border border-amber-500/30" title="Draft - No stock impact">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Draft
                          </span>
                        )}
                        {move.status === "waiting" && (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-purple-300 font-bold border border-purple-500/30">
                            Waiting
                          </span>
                        )}
                        {move.status === "ready" && (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-sky-300 font-bold border border-sky-500/30">
                            Ready
                          </span>
                        )}
                        {move.status === "canceled" && (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-zinc-500 font-medium border border-zinc-700/60" title="Canceled - No stock impact">
                            Canceled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/60 px-4 py-3 font-mono text-xs text-zinc-400">
          <span>Showing {filteredMovements.length} of {movements.length} movement records</span>
          <span className="hidden sm:inline text-zinc-500">
            Stock ledger is append-only; derived stock counts status = "done" only
          </span>
        </div>
      </div>
    </div>
  );
}
