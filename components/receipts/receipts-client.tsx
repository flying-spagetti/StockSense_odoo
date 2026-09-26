"use client";

import React, { useState, useMemo, useTransition } from "react";
import { validateReceiptAction, cancelReceiptAction } from "@/app/actions/receipts";
import { ReceiptFormModal } from "@/components/receipts/receipt-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  PlusIcon,
  ReceiptsIcon,
  CheckCircleIcon,
  XIcon,
} from "@/components/ui/icons";
import type { ReceiptDetailRow, ProductRow } from "@/lib/db/queries";

interface ReceiptsClientProps {
  receipts: ReceiptDetailRow[];
  products: ProductRow[];
  nextReference: string;
}

export function ReceiptsClient({ receipts, products, nextReference }: ReceiptsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleValidate = (id: string, reference: string) => {
    startTransition(async () => {
      const res = await validateReceiptAction(id);
      if (res.success) {
        showToast(`Receipt ${reference} validated! Derived stock increased.`);
      } else {
        showToast(`Error: ${res.message}`);
      }
    });
  };

  const handleCancel = (id: string, reference: string) => {
    startTransition(async () => {
      const res = await cancelReceiptAction(id);
      if (res.success) {
        showToast(`Receipt ${reference} canceled.`);
      } else {
        showToast(`Error: ${res.message}`);
      }
    });
  };

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Search term
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.reference.toLowerCase().includes(q) ||
        (r.supplier && r.supplier.toLowerCase().includes(q)) ||
        r.productName.toLowerCase().includes(q) ||
        r.productSku.toLowerCase().includes(q);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "draft") {
        matchesStatus = r.status === "draft";
      } else if (statusFilter === "done") {
        matchesStatus = r.status === "done";
      } else if (statusFilter === "canceled") {
        matchesStatus = r.status === "canceled";
      }

      return matchesSearch && matchesStatus;
    });
  }, [receipts, search, statusFilter]);

  // Counts for metric cards
  const totalCount = receipts.length;
  const draftCount = receipts.filter((r) => r.status === "draft").length;
  const doneCount = receipts.filter((r) => r.status === "done").length;
  const canceledCount = receipts.filter((r) => r.status === "canceled").length;

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
      {/* Compact Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-zinc-900 px-4 py-3 text-sm text-emerald-300 shadow-2xl animate-fade-in font-mono">
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
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
            <ReceiptsIcon className="h-6 w-6 text-emerald-400" />
            Receipts
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Receive incoming products into warehouse locations. Validated receipts add to derived stock.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Receipt</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Receipts</p>
          <p className="mt-1 text-2xl font-bold font-mono text-white">{totalCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-amber-400">Draft Receipts</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{draftCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-400">Done</p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{doneCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Canceled</p>
          <p className="mt-1 text-2xl font-bold font-mono text-zinc-500">{canceledCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search by reference, supplier, product..."
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
        <div className="flex w-full sm:w-auto items-center rounded-lg bg-zinc-950 p-1 border border-zinc-800 font-mono text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex-1 sm:flex-none rounded-md px-3 py-1.5 transition ${
              statusFilter === "all" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({receipts.length})
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`flex-1 sm:flex-none rounded-md px-3 py-1.5 transition ${
              statusFilter === "draft" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Draft ({draftCount})
          </button>
          <button
            onClick={() => setStatusFilter("done")}
            className={`flex-1 sm:flex-none rounded-md px-3 py-1.5 transition ${
              statusFilter === "done" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Done ({doneCount})
          </button>
          <button
            onClick={() => setStatusFilter("canceled")}
            className={`flex-1 sm:flex-none rounded-md px-3 py-1.5 transition ${
              statusFilter === "canceled" ? "bg-zinc-800 text-zinc-300 font-bold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Canceled ({canceledCount})
          </button>
        </div>
      </div>

      {/* Receipts Simple List Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                <th scope="col" className="px-4 py-3 font-medium">Supplier</th>
                <th scope="col" className="px-4 py-3 font-medium">Product</th>
                <th scope="col" className="px-4 py-3 font-medium">Destination</th>
                <th scope="col" className="px-4 py-3 font-medium">Quantity</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Created</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    No receipts found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => {
                  return (
                    <tr
                      key={receipt.id}
                      className="transition-colors hover:bg-zinc-800/40"
                    >
                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-amber-400">
                        {receipt.reference}
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3.5 text-xs text-zinc-300">
                        {receipt.supplier || "—"}
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{receipt.productName}</div>
                        <div className="font-mono text-[11px] text-zinc-500">{receipt.productSku}</div>
                      </td>

                      {/* Destination */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800">
                          {receipt.toLocationId || "WH/Stock"}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-emerald-400">
                        +{receipt.quantity} {receipt.productUnit}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-xs font-mono">
                        {receipt.status === "done" && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-emerald-400 font-bold border border-emerald-500/30">
                            <CheckCircleIcon className="h-3.5 w-3.5" /> Done
                          </span>
                        )}
                        {receipt.status === "draft" && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-1 text-amber-300 font-bold border border-amber-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Draft
                          </span>
                        )}
                        {receipt.status === "waiting" && (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2.5 py-1 text-purple-300 font-bold border border-purple-500/30">
                            Waiting
                          </span>
                        )}
                        {receipt.status === "ready" && (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2.5 py-1 text-sky-300 font-bold border border-sky-500/30">
                            Ready
                          </span>
                        )}
                        {receipt.status === "canceled" && (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-zinc-500 font-medium border border-zinc-700/60">
                            Canceled
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                        {formatDate(receipt.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {receipt.status === "draft" && (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() => handleValidate(receipt.id, receipt.reference)}
                              className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              <span>Validate</span>
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => handleCancel(receipt.id, receipt.reference)}
                              className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {receipt.status === "done" && (
                          <span className="text-xs text-zinc-500 font-mono">Stock credited</span>
                        )}

                        {receipt.status === "canceled" && (
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
          <span>Showing {filteredReceipts.length} of {receipts.length} receipts</span>
          <span className="hidden sm:inline text-zinc-500">
            Validated receipts directly increase Derived Stock on Products
          </span>
        </div>
      </div>

      {/* New Receipt Modal */}
      <ReceiptFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={products}
        defaultReference={nextReference}
        onSuccessToast={showToast}
      />
    </div>
  );
}
