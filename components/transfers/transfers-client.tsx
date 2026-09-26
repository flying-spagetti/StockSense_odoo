"use client";

import React, { useState, useMemo, useTransition } from "react";
import { validateTransferAction, cancelTransferAction } from "@/app/actions/transfers";
import { TransferFormModal } from "@/components/transfers/transfer-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  PlusIcon,
  TransfersIcon,
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
  EditIcon,
} from "@/components/ui/icons";
import type { TransferDetailRow, ProductRow, InventoryRow } from "@/lib/db/queries";

interface TransfersClientProps {
  transfers: TransferDetailRow[];
  products: ProductRow[];
  inventory: InventoryRow[];
  nextReference: string;
}

export function TransfersClient({
  transfers,
  products,
  inventory,
  nextReference,
}: TransfersClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editingTransfer, setEditingTransfer] = useState<TransferDetailRow | null>(null);

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  const handleEdit = (transfer: TransferDetailRow) => {
    setEditingTransfer(transfer);
    setIsModalOpen(true);
  };

  const handleValidate = (id: string, reference: string) => {
    startTransition(async () => {
      const res = await validateTransferAction(id);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message || `Failed to validate transfer ${reference}.`, true);
      }
    });
  };

  const handleCancel = (id: string, reference: string) => {
    startTransition(async () => {
      const res = await cancelTransferAction(id);
      if (res.success) {
        showToast(`Transfer ${reference} canceled.`);
      } else {
        showToast(`Error: ${res.message}`, true);
      }
    });
  };

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.reference.toLowerCase().includes(q) ||
        t.productName.toLowerCase().includes(q) ||
        t.productSku.toLowerCase().includes(q) ||
        t.fromLocationId.toLowerCase().includes(q) ||
        t.toLocationId.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "draft") {
        matchesStatus = t.status === "draft";
      } else if (statusFilter === "waiting") {
        matchesStatus = t.status === "waiting";
      } else if (statusFilter === "ready") {
        matchesStatus = t.status === "ready";
      } else if (statusFilter === "done") {
        matchesStatus = t.status === "done";
      } else if (statusFilter === "canceled") {
        matchesStatus = t.status === "canceled";
      }

      return matchesSearch && matchesStatus;
    });
  }, [transfers, search, statusFilter]);

  // Counts
  const totalCount = transfers.length;
  const draftCount = transfers.filter((t) => t.status === "draft").length;
  const waitingCount = transfers.filter((t) => t.status === "waiting").length;
  const readyCount = transfers.filter((t) => t.status === "ready").length;
  const doneCount = transfers.filter((t) => t.status === "done").length;
  const canceledCount = transfers.filter((t) => t.status === "canceled").length;

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
              : "border-indigo-500/40 bg-zinc-900 text-indigo-200 ring-1 ring-indigo-500/30"
          }`}
        >
          {toast.isError ? (
            <AlertTriangleIcon className="h-5 w-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-indigo-400 shrink-0" />
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
            <TransfersIcon className="h-6 w-6 text-indigo-400" />
            Internal Transfers
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Relocate stock across warehouses and zones. Stock decreases at source and increases at destination with zero net impact on overall stock.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingTransfer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New transfer</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Transfers</p>
          <p className="mt-1 text-2xl font-bold font-mono text-white">{totalCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-amber-400">Draft Transfers</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{draftCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-indigo-400">Done (Relocated)</p>
          <p className="mt-1 text-2xl font-bold font-mono text-indigo-400">{doneCount}</p>
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
            className="pl-9 bg-zinc-950 border-zinc-700 focus:border-indigo-500"
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
            All ({transfers.length})
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
            onClick={() => setStatusFilter("waiting")}
            className={`rounded-md px-3 py-1.5 transition ${
              statusFilter === "waiting" ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Waiting ({waitingCount})
          </button>
          <button
            onClick={() => setStatusFilter("ready")}
            className={`rounded-md px-3 py-1.5 transition ${
              statusFilter === "ready" ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Ready ({readyCount})
          </button>
          <button
            onClick={() => setStatusFilter("done")}
            className={`rounded-md px-3 py-1.5 transition ${
              statusFilter === "done" ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30" : "text-zinc-400 hover:text-zinc-200"
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
                <th scope="col" className="px-4 py-3 font-medium">From</th>
                <th scope="col" className="px-4 py-3 font-medium">To</th>
                <th scope="col" className="px-4 py-3 font-medium">Quantity</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Created</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    No internal transfers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => {
                  const isSameLoc =
                    transfer.fromLocationId.trim().toLowerCase() ===
                    transfer.toLocationId.trim().toLowerCase();

                  return (
                    <tr
                      key={transfer.id}
                      className="transition-colors hover:bg-zinc-800/40"
                    >
                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-indigo-400">
                        {transfer.reference}
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{transfer.productName}</div>
                        <div className="font-mono text-[11px] text-zinc-500">{transfer.productSku}</div>
                      </td>

                      {/* From Location */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        <span className="inline-block rounded bg-zinc-950 px-2.5 py-1 border border-zinc-800 font-semibold text-zinc-200">
                          {transfer.fromLocationId}
                        </span>
                      </td>

                      {/* To Location */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        <span className="inline-block rounded bg-indigo-950/40 px-2.5 py-1 border border-indigo-800/50 font-semibold text-indigo-300">
                          {transfer.toLocationId}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-white">
                        {transfer.quantity} {transfer.productUnit}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-xs font-mono">
                        {transfer.status === "done" && (
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2.5 py-1 text-indigo-400 font-bold border border-indigo-500/30">
                            <CheckCircleIcon className="h-3.5 w-3.5" /> Done
                          </span>
                        )}
                        {transfer.status === "draft" && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-1 text-amber-300 font-bold border border-amber-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Draft
                          </span>
                        )}
                        {transfer.status === "waiting" && (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2.5 py-1 text-purple-300 font-bold border border-purple-500/30">
                            Waiting
                          </span>
                        )}
                        {transfer.status === "ready" && (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2.5 py-1 text-sky-300 font-bold border border-sky-500/30">
                            Ready
                          </span>
                        )}
                        {transfer.status === "canceled" && (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-zinc-500 font-medium border border-zinc-700/60">
                            Canceled
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                        {formatDate(transfer.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {transfer.status === "draft" && (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() => handleEdit(transfer)}
                              className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition disabled:opacity-50"
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              disabled={isPending || isSameLoc}
                              onClick={() => handleValidate(transfer.id, transfer.reference)}
                              className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
                              title="Validate transfer"
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              <span>Validate</span>
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => handleCancel(transfer.id, transfer.reference)}
                              className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {transfer.status === "done" && (
                          <span className="text-xs text-zinc-500 font-mono">Transferred</span>
                        )}

                        {transfer.status === "canceled" && (
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
          <span>Showing {filteredTransfers.length} of {transfers.length} transfers</span>
          <span className="hidden sm:inline text-zinc-500">
            Source & Destination locations must differ; stock validated server-side
          </span>
        </div>
      </div>

      {/* Transfer Form Modal */}
      <TransferFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransfer(null);
        }}
        products={products}
        inventory={inventory}
        defaultReference={nextReference}
        transferToEdit={editingTransfer}
        onSuccessToast={showToast}
      />
    </div>
  );
}
