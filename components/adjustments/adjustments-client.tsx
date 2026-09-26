"use client";

import React, { useState, useMemo, useTransition } from "react";
import { validateAdjustmentAction, cancelAdjustmentAction } from "@/app/actions/adjustments";
import { AdjustmentFormModal } from "@/components/adjustments/adjustment-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  PlusIcon,
  AdjustmentsIcon,
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";
import type { AdjustmentDetailRow, ProductRow, InventoryRow } from "@/lib/db/queries";

interface AdjustmentsClientProps {
  adjustments: AdjustmentDetailRow[];
  products: ProductRow[];
  inventory: InventoryRow[];
  nextReference: string;
}

export function AdjustmentsClient({
  adjustments,
  products,
  inventory,
  nextReference,
}: AdjustmentsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  const handleValidate = (id: string, reference: string) => {
    startTransition(async () => {
      const res = await validateAdjustmentAction(id);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message || `Failed to post adjustment ${reference}.`, true);
      }
    });
  };

  const handleCancel = (id: string, reference: string) => {
    startTransition(async () => {
      const res = await cancelAdjustmentAction(id);
      if (res.success) {
        showToast(`Adjustment ${reference} canceled.`);
      } else {
        showToast(`Error: ${res.message}`, true);
      }
    });
  };

  // Filtered adjustments
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.reference.toLowerCase().includes(q) ||
        a.productName.toLowerCase().includes(q) ||
        a.productSku.toLowerCase().includes(q) ||
        a.locationId.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "draft") {
        matchesStatus = a.status === "draft";
      } else if (statusFilter === "done") {
        matchesStatus = a.status === "done";
      } else if (statusFilter === "canceled") {
        matchesStatus = a.status === "canceled";
      }

      return matchesSearch && matchesStatus;
    });
  }, [adjustments, search, statusFilter]);

  // Counts
  const totalCount = adjustments.length;
  const draftCount = adjustments.filter((a) => a.status === "draft").length;
  const doneCount = adjustments.filter((a) => a.status === "done").length;
  const canceledCount = adjustments.filter((a) => a.status === "canceled").length;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-mono shadow-2xl animate-fade-in ${
            toast.isError
              ? "border-amber-500/50 bg-zinc-900 text-amber-300 ring-1 ring-amber-500/30"
              : "border-amber-500/40 bg-zinc-900 text-amber-200 ring-1 ring-amber-500/30"
          }`}
        >
          {toast.isError ? (
            <AlertTriangleIcon className="h-5 w-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-amber-400 shrink-0" />
          )}
          <span className="font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AdjustmentsIcon className="h-6 w-6 text-amber-400" />
            Stock Adjustments
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Reconcile system recorded stock against physical inventory counts. Physical final counts generate positive or negative movement deltas.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New adjustment</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Audits</p>
          <p className="mt-1 text-2xl font-bold font-mono text-white">{totalCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-amber-400">Draft Adjustments</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{draftCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-400">Done (Posted)</p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{doneCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Canceled</p>
          <p className="mt-1 text-2xl font-bold font-mono text-zinc-500">{canceledCount}</p>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search by reference or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-950 border-zinc-700 focus:border-amber-500"
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

        {/* Status Filter Tabs */}
        <div className="flex w-full sm:w-auto items-center rounded-lg bg-zinc-950 p-1 border border-zinc-800 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-md px-3 py-1.5 transition ${
              statusFilter === "all" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({adjustments.length})
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`rounded-md px-3 py-1.5 transition ${
              statusFilter === "draft" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Draft ({draftCount})
          </button>
          <button
            onClick={() => setStatusFilter("done")}
            className={`rounded-md px-3 py-1.5 transition ${
              statusFilter === "done" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Done ({doneCount})
          </button>
          <button
            onClick={() => setStatusFilter("canceled")}
            className={`rounded-md px-3 py-1.5 transition ${
              statusFilter === "canceled" ? "bg-zinc-800 text-zinc-300 font-bold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Canceled ({canceledCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                <th scope="col" className="px-4 py-3 font-medium">Product</th>
                <th scope="col" className="px-4 py-3 font-medium">Location</th>
                <th scope="col" className="px-4 py-3 font-medium">Recorded Stock</th>
                <th scope="col" className="px-4 py-3 font-medium">Physical Count</th>
                <th scope="col" className="px-4 py-3 font-medium">Delta</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Created</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    No stock adjustments found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => {
                  const isPositiveDelta = adj.delta > 0;
                  const isNegativeDelta = adj.delta < 0;

                  return (
                    <tr
                      key={adj.id}
                      className="transition-colors hover:bg-zinc-800/40"
                    >
                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-amber-400">
                        {adj.reference}
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{adj.productName}</div>
                        <div className="font-mono text-[11px] text-zinc-500">{adj.productSku}</div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        <span className="inline-block rounded bg-zinc-950 px-2.5 py-1 border border-zinc-800 font-semibold text-zinc-200">
                          {adj.locationId}
                        </span>
                      </td>

                      {/* Recorded Stock */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-400">
                        {adj.recordedStock} {adj.productUnit}
                      </td>

                      {/* Physical Count */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-white">
                        {adj.physicalCount} {adj.productUnit}
                      </td>

                      {/* Delta */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold">
                        <span
                          className={`inline-block rounded px-2 py-0.5 border ${
                            isPositiveDelta
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isNegativeDelta
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {isPositiveDelta ? `+${adj.delta}` : adj.delta} {adj.productUnit}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-xs font-mono">
                        {adj.status === "done" && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-emerald-400 font-bold border border-emerald-500/30">
                            <CheckCircleIcon className="h-3.5 w-3.5" /> Done
                          </span>
                        )}
                        {adj.status === "draft" && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-1 text-amber-300 font-bold border border-amber-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Draft
                          </span>
                        )}
                        {adj.status === "canceled" && (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-zinc-500 font-medium border border-zinc-700/60">
                            Canceled
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                        {formatDate(adj.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {adj.status === "draft" && (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() => handleValidate(adj.id, adj.reference)}
                              className="inline-flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-500 transition disabled:opacity-50"
                              title="Post adjustment"
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              <span>Post</span>
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => handleCancel(adj.id, adj.reference)}
                              className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {adj.status === "done" && (
                          <span className="text-xs text-zinc-500 font-mono">Posted</span>
                        )}

                        {adj.status === "canceled" && (
                          <span className="text-xs text-zinc-600 font-mono">No stock impact</span>
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
          <span>Showing {filteredAdjustments.length} of {adjustments.length} adjustments</span>
          <span className="hidden sm:inline text-zinc-500">
            Physical final count generates delta; zero delta is rejected
          </span>
        </div>
      </div>

      {/* New Adjustment Modal */}
      <AdjustmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={products}
        inventory={inventory}
        defaultReference={nextReference}
        onSuccessToast={showToast}
      />
    </div>
  );
}
