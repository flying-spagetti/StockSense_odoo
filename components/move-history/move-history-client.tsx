"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SearchIcon,
  MoveHistoryIcon,
  CheckCircleIcon,
  XIcon,
  FilterIcon,
  PackageIcon,
  ReceiptsIcon,
  DeliveriesIcon,
  TransfersIcon,
  AdjustmentsIcon,
  AlertTriangleIcon,
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
  const [dateFilter, setDateFilter] = useState<string>("all");

  const [selectedMove, setSelectedMove] = useState<MoveHistoryRow | null>(null);

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
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;

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
        else if (typeFilter === "issue") matchesType = m.kind === "issue";
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

      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const moveTime = new Date(m.createdAt).getTime();
        const diff = now - moveTime;
        if (dateFilter === "today") matchesDate = diff <= oneDay;
        else if (dateFilter === "7days") matchesDate = diff <= sevenDays;
        else if (dateFilter === "30days") matchesDate = diff <= thirtyDays;
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesLocation &&
        matchesCategory &&
        matchesDate
      );
    });
  }, [movements, search, typeFilter, statusFilter, locationFilter, categoryFilter, dateFilter]);

  // Metrics Summary
  const totalCount = movements.length;
  const doneCount = movements.filter((m) => m.status === "done").length;
  const receiptCount = movements.filter((m) => m.kind === "receipt" && m.status === "done").length;
  const deliveryCount = movements.filter((m) => m.kind === "issue" && m.status === "done").length;
  const transferCount = movements.filter((m) => m.kind === "transfer" && m.status === "done").length;
  const adjustmentCount = movements.filter((m) => m.kind === "adjustment" && m.status === "done").length;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportCSV = () => {
    const headers = [
      "Date",
      "Reference",
      "Type",
      "Product SKU",
      "Product Name",
      "Category",
      "Partner/Source",
      "From Location",
      "To Location",
      "Quantity",
      "Status",
      "Note",
    ];

    const rows = filteredMovements.map((m) => [
      new Date(m.createdAt).toISOString(),
      m.reference,
      m.typeLabel,
      m.productSku,
      `"${m.productName.replace(/"/g, '""')}"`,
      m.productCategory,
      `"${(m.supplierOrCustomer || "").replace(/"/g, '""')}"`,
      m.fromLocationId || "",
      m.toLocationId || "",
      m.signedQuantity,
      m.status,
      `"${(m.note || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `StockSense_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MoveHistoryIcon className="h-6 w-6 text-indigo-400" />
            Stock Audit Ledger
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Unified, append-only stock movement log. Derived inventory strictly aggregates completed (<code className="text-emerald-400">done</code>) movements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={exportCSV}
            variant="secondary"
            className="flex items-center gap-1.5 text-xs font-mono"
          >
            <span>📥 Export CSV Ledger</span>
          </Button>

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Audit Trail ({totalCount})</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Move Records</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{totalCount}</span>
            <span className="text-xs font-mono text-emerald-400">{doneCount} validated</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <ReceiptsIcon className="h-3.5 w-3.5" /> Receipts Posted
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">{receiptCount}</span>
            <span className="text-[11px] font-mono text-zinc-500">Incoming stock</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <DeliveriesIcon className="h-3.5 w-3.5" /> Deliveries Dispatched
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-400">{deliveryCount}</span>
            <span className="text-[11px] font-mono text-zinc-500">Outgoing stock</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1">
            <TransfersIcon className="h-3.5 w-3.5" /> Internal Transfers & Audits
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-sky-300">{transferCount + adjustmentCount}</span>
            <span className="text-[11px] font-mono text-zinc-500">{transferCount} TR / {adjustmentCount} ADJ</span>
          </div>
        </div>
      </div>

      {/* Smart Filter Bar & Date Quick Filter */}
      <div className="space-y-3">
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
          placeholder="Search by SKU, product name, reference, partner, or location..."
        />

        {/* Date Filter Quick Bar */}
        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto bg-zinc-950 p-2 rounded-lg border border-zinc-800">
          <span className="text-zinc-500 px-2 uppercase text-[10px] font-bold">Time Window:</span>
          <button
            onClick={() => setDateFilter("all")}
            className={`px-2.5 py-1 rounded transition ${
              dateFilter === "all" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateFilter("today")}
            className={`px-2.5 py-1 rounded transition ${
              dateFilter === "today" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => setDateFilter("7days")}
            className={`px-2.5 py-1 rounded transition ${
              dateFilter === "7days" ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateFilter("30days")}
            className={`px-2.5 py-1 rounded transition ${
              dateFilter === "30days" ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Timestamp</th>
                <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                <th scope="col" className="px-4 py-3 font-medium">Movement Kind</th>
                <th scope="col" className="px-4 py-3 font-medium">Product Item</th>
                <th scope="col" className="px-4 py-3 font-medium">From</th>
                <th scope="col" className="px-4 py-3 font-medium">To</th>
                <th scope="col" className="px-4 py-3 font-medium">Quantity</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    No stock movements found matching the current search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((move) => {
                  const isDone = move.status === "done";
                  const isMuted = move.status === "draft" || move.status === "canceled";

                  return (
                    <tr
                      key={move.id}
                      onClick={() => setSelectedMove(move)}
                      className={`transition-colors cursor-pointer hover:bg-zinc-800/50 ${
                        isMuted ? "opacity-75 bg-zinc-950/40" : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {formatDate(move.createdAt)}
                      </td>

                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-zinc-200">
                        {move.reference}
                      </td>

                      {/* Movement Kind Badge */}
                      <td className="px-4 py-3.5 text-xs font-mono">
                        {move.kind === "receipt" && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-0.5 text-emerald-400 font-bold border border-emerald-500/30">
                            <ReceiptsIcon className="h-3 w-3" /> Receipt
                          </span>
                        )}
                        {move.kind === "issue" && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-0.5 text-amber-400 font-bold border border-amber-500/30">
                            <DeliveriesIcon className="h-3 w-3" /> Delivery
                          </span>
                        )}
                        {move.kind === "transfer" && (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2.5 py-0.5 text-sky-400 font-bold border border-sky-500/30">
                            <TransfersIcon className="h-3 w-3" /> Transfer
                          </span>
                        )}
                        {move.kind === "adjustment" && (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2.5 py-0.5 text-purple-300 font-bold border border-purple-500/30">
                            <AdjustmentsIcon className="h-3 w-3" /> Adjustment
                          </span>
                        )}
                      </td>

                      {/* Product Item */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{move.productName}</div>
                        <div className="font-mono text-[11px] text-zinc-500">
                          <code className="text-zinc-300 font-bold">{move.productSku}</code> • {move.productCategory}
                        </div>
                      </td>

                      {/* From Location */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        {move.fromLocationId ? (
                          <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800 font-semibold text-zinc-300">
                            {move.fromLocationId}
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono">— (Vendor)</span>
                        )}
                      </td>

                      {/* To Location */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        {move.toLocationId ? (
                          <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800 font-semibold text-indigo-300">
                            {move.toLocationId}
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono">— (Customer)</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold whitespace-nowrap">
                        {move.kind === "receipt" && (
                          <span className="text-emerald-400 font-bold">+{move.quantity} {move.productUnit}</span>
                        )}
                        {move.kind === "issue" && (
                          <span className="text-amber-400 font-bold">-{move.quantity} {move.productUnit}</span>
                        )}
                        {move.kind === "transfer" && (
                          <span className="text-sky-300 font-bold">{move.quantity} {move.productUnit}</span>
                        )}
                        {move.kind === "adjustment" && (
                          <span className={move.signedQuantity > 0 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
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

                      {/* Inspect Button */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMove(move);
                          }}
                          className="px-2.5 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-500 transition"
                        >
                          Audit
                        </button>
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
            Stock ledger is append-only; on-hand stock derived strictly from status = "done"
          </span>
        </div>
      </div>

      {/* Movement Audit Trail Detail Modal */}
      {selectedMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-zinc-400">Ledger Entry Audit</span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono font-bold text-amber-400">
                    {selectedMove.reference}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                  {selectedMove.productName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMove(null)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Audit Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase">Product SKU</span>
                <span className="font-bold text-amber-400 text-sm">{selectedMove.productSku}</span>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase">Movement Kind</span>
                <span className="font-bold text-white capitalize">{selectedMove.typeLabel}</span>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase">Source Location</span>
                <span className="font-semibold text-zinc-200">{selectedMove.fromLocationId || "External Supplier/Vendor"}</span>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase">Destination Location</span>
                <span className="font-semibold text-indigo-300">{selectedMove.toLocationId || "External Customer/Outbound"}</span>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase">Movement Quantity</span>
                <span className="font-bold text-white text-sm">
                  {selectedMove.signedQuantity > 0 ? `+${selectedMove.signedQuantity}` : selectedMove.signedQuantity} {selectedMove.productUnit}
                </span>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase">Inventory Status</span>
                <span className={`font-bold uppercase text-xs ${selectedMove.status === 'done' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedMove.status} {selectedMove.status === 'done' ? '✓ (Applied)' : '(No Impact)'}
                </span>
              </div>
            </div>

            {/* Partner & Notes Panel */}
            <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800 font-mono text-xs space-y-2">
              {selectedMove.supplierOrCustomer && (
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block">Supplier / Customer / Partner:</span>
                  <span className="text-zinc-200 font-semibold">{selectedMove.supplierOrCustomer}</span>
                </div>
              )}

              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Audit Timestamp:</span>
                <span className="text-zinc-300">{formatDate(selectedMove.createdAt)} ({new Date(selectedMove.createdAt).toISOString()})</span>
              </div>

              {selectedMove.note && (
                <div className="pt-2 border-t border-zinc-900">
                  <span className="text-zinc-500 text-[10px] uppercase block">Notes & Justification:</span>
                  <p className="text-zinc-300 italic text-[11px] mt-0.5">"{selectedMove.note}"</p>
                </div>
              )}
            </div>

            {/* Inventory Ledger Rule Notice */}
            <div className="rounded-md border border-zinc-800 bg-zinc-950/80 p-3 text-[11px] font-mono text-zinc-400 flex items-start gap-2">
              <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                {selectedMove.status === 'done'
                  ? "This movement is validated and permanently recorded in the ledger. It directly updates total derived product stock."
                  : "This movement is currently in draft or canceled status. It does not alter derived product inventory."}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedMove(null)} variant="secondary" className="text-xs font-mono">
                Close Audit Inspection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
