"use client";

import React, { useState, useMemo, useTransition } from "react";
import { validateDeliveryAction, cancelDeliveryAction } from "@/app/actions/deliveries";
import { DeliveryFormModal } from "@/components/deliveries/delivery-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  PlusIcon,
  DeliveriesIcon,
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";
import type { DeliveryDetailRow, ProductRow, InventoryRow } from "@/lib/db/queries";

interface DeliveriesClientProps {
  deliveries: DeliveryDetailRow[];
  products: ProductRow[];
  inventory: InventoryRow[];
  nextReference: string;
}

export function DeliveriesClient({
  deliveries,
  products,
  inventory,
  nextReference,
}: DeliveriesClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast(null);
    }, 5500);
  };

  const handleValidate = (id: string, reference: string) => {
    startTransition(async () => {
      const res = await validateDeliveryAction(id);
      if (res.success) {
        showToast(res.message || `Delivery ${reference} validated! Derived stock decreased.`);
      } else {
        showToast(res.message || `Failed to validate delivery ${reference}.`, true);
      }
    });
  };

  const handleCancel = (id: string, reference: string) => {
    startTransition(async () => {
      const res = await cancelDeliveryAction(id);
      if (res.success) {
        showToast(`Delivery ${reference} canceled.`);
      } else {
        showToast(`Error: ${res.message}`, true);
      }
    });
  };

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      // Search query
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.reference.toLowerCase().includes(q) ||
        (d.customer && d.customer.toLowerCase().includes(q)) ||
        d.productName.toLowerCase().includes(q) ||
        d.productSku.toLowerCase().includes(q);

      // Status filter tab
      let matchesStatus = true;
      if (statusFilter === "draft") {
        matchesStatus = d.status === "draft";
      } else if (statusFilter === "waiting") {
        matchesStatus = d.status === "waiting";
      } else if (statusFilter === "ready") {
        matchesStatus = d.status === "ready";
      } else if (statusFilter === "done") {
        matchesStatus = d.status === "done";
      } else if (statusFilter === "canceled") {
        matchesStatus = d.status === "canceled";
      }

      return matchesSearch && matchesStatus;
    });
  }, [deliveries, search, statusFilter]);

  // Status counts for metric cards and tab badges
  const totalCount = deliveries.length;
  const draftCount = deliveries.filter((d) => d.status === "draft").length;
  const waitingCount = deliveries.filter((d) => d.status === "waiting").length;
  const readyCount = deliveries.filter((d) => d.status === "ready").length;
  const doneCount = deliveries.filter((d) => d.status === "done").length;
  const canceledCount = deliveries.filter((d) => d.status === "canceled").length;

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
      {/* Toast Notification (Green for success, Red/Amber for errors) */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-mono shadow-2xl animate-fade-in ${
            toast.isError
              ? "border-amber-500/50 bg-zinc-900 text-amber-300 ring-1 ring-amber-500/30"
              : "border-emerald-500/40 bg-zinc-900 text-emerald-300"
          }`}
        >
          {toast.isError ? (
            <AlertTriangleIcon className="h-5 w-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
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
            <DeliveriesIcon className="h-6 w-6 text-sky-400" />
            Deliveries
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Process customer sales orders. Validating a delivery decreases derived stock if sufficient stock exists at source.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Delivery</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Orders</p>
          <p className="mt-1 text-2xl font-bold font-mono text-white">{totalCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-amber-400">Draft Orders</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{draftCount}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-400">Done (Dispatched)</p>
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
            placeholder="Search by reference, customer, product..."
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
            All ({deliveries.length})
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

      {/* Deliveries Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Product</th>
                <th scope="col" className="px-4 py-3 font-medium">Source</th>
                <th scope="col" className="px-4 py-3 font-medium">Quantity</th>
                <th scope="col" className="px-4 py-3 font-medium">Available</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Created</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    No delivery orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const isInsufficient =
                    delivery.status === "draft" && delivery.quantity > delivery.availableStock;

                  return (
                    <tr
                      key={delivery.id}
                      className="transition-colors hover:bg-zinc-800/40"
                    >
                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-sky-400">
                        {delivery.reference}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5 text-xs text-zinc-300">
                        {delivery.customer || "—"}
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{delivery.productName}</div>
                        <div className="font-mono text-[11px] text-zinc-500">{delivery.productSku}</div>
                      </td>

                      {/* Source Location */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                        <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800">
                          {delivery.fromLocationId || "WH/Stock"}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-amber-400">
                        -{delivery.quantity} {delivery.productUnit}
                      </td>

                      {/* Available Stock */}
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold ${
                            isInsufficient
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-zinc-950 text-zinc-300 border border-zinc-800"
                          }`}
                        >
                          {delivery.availableStock} {delivery.productUnit}
                          {isInsufficient && (
                            <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-400" title="Requested quantity exceeds available stock" />
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-xs font-mono">
                        {delivery.status === "done" && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-emerald-400 font-bold border border-emerald-500/30">
                            <CheckCircleIcon className="h-3.5 w-3.5" /> Done
                          </span>
                        )}
                        {delivery.status === "draft" && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-1 text-amber-300 font-bold border border-amber-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Draft
                          </span>
                        )}
                        {delivery.status === "waiting" && (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2.5 py-1 text-purple-300 font-bold border border-purple-500/30">
                            Waiting
                          </span>
                        )}
                        {delivery.status === "ready" && (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2.5 py-1 text-sky-300 font-bold border border-sky-500/30">
                            Ready
                          </span>
                        )}
                        {delivery.status === "canceled" && (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-zinc-500 font-medium border border-zinc-700/60">
                            Canceled
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                        {formatDate(delivery.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {delivery.status === "draft" && (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() => handleValidate(delivery.id, delivery.reference)}
                              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold text-white transition disabled:opacity-50 ${
                                isInsufficient
                                  ? "bg-amber-600/80 hover:bg-amber-600 text-amber-100"
                                  : "bg-emerald-600 hover:bg-emerald-500"
                              }`}
                              title={isInsufficient ? "Stock insufficient - validation will fail" : "Validate delivery"}
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              <span>Validate</span>
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => handleCancel(delivery.id, delivery.reference)}
                              className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {delivery.status === "done" && (
                          <span className="text-xs text-zinc-500 font-mono">Stock deducted</span>
                        )}

                        {delivery.status === "canceled" && (
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
          <span>Showing {filteredDeliveries.length} of {deliveries.length} deliveries</span>
          <span className="hidden sm:inline text-zinc-500">
            Validation requires sufficient available stock at source location
          </span>
        </div>
      </div>

      {/* New Delivery Modal */}
      <DeliveryFormModal
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
