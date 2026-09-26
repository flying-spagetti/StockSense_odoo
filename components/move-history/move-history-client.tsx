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

      {/* Filter Controls Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 font-mono text-xs">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search ref, product, SKU, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-xs focus:border-indigo-500 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Document Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus:border-indigo-500"
          >
            <option value="all">Document: All Types</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus:border-indigo-500"
          >
            <option value="all">Status: All Statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus:border-indigo-500"
          >
            <option value="all">Location: All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus:border-indigo-500"
          >
            <option value="all">Category: All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filters button */}
        {(search || typeFilter !== "all" || statusFilter !== "all" || locationFilter !== "all" || categoryFilter !== "all") && (
          <div className="lg:col-span-3 flex items-center justify-end">
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
                setLocationFilter("all");
                setCategoryFilter("all");
              }}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              <XIcon className="h-3.5 w-3.5" /> Reset all filters
            </button>
          </div>
        )}
      </div>

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
