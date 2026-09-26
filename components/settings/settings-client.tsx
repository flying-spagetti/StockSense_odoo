"use client";

import React, { useState, useTransition } from "react";
import { toggleWarehouseStatusAction } from "@/app/actions/warehouses";
import { WarehouseFormModal } from "@/components/settings/warehouse-form-modal";
import { Button } from "@/components/ui/button";
import {
  SettingsIcon,
  PlusIcon,
  EditIcon,
  CheckCircleIcon,
  XIcon,
} from "@/components/ui/icons";
import type { WarehouseRow } from "@/lib/db/queries";

interface SettingsClientProps {
  warehouses: WarehouseRow[];
}

export function SettingsClient({ warehouses }: SettingsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseRow | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleEdit = (wh: WarehouseRow) => {
    setEditingWarehouse(wh);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (wh: WarehouseRow) => {
    startTransition(async () => {
      const res = await toggleWarehouseStatusAction(wh.id);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message || "Failed to update warehouse status.", true);
      }
    });
  };

  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter((w) => w.isActive).length;
  const totalLocations = warehouses.reduce((acc, curr) => acc + curr.locations.length, 0);

  return (
    <div className="space-y-6">
      {/* Compact Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-2xl animate-fade-in font-mono ${
            toast.isError
              ? "border-red-500/40 bg-zinc-900 text-red-300"
              : "border-emerald-500/40 bg-zinc-900 text-emerald-300"
          }`}
        >
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
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
            <SettingsIcon className="h-6 w-6 text-zinc-400" />
            System Settings & Warehouse Config
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Manage operational warehouses and location routes. Soft disable warehouses to preserve historical stock movements.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingWarehouse(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Warehouse</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Warehouses</p>
          <p className="mt-1 text-2xl font-bold font-mono text-white">{totalWarehouses}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-400">Active Facilities</p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{activeWarehouses}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-sky-400">Managed Locations</p>
          <p className="mt-1 text-2xl font-bold font-mono text-sky-400">{totalLocations}</p>
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Code</th>
                <th scope="col" className="px-4 py-3 font-medium">Warehouse Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Facility Address</th>
                <th scope="col" className="px-4 py-3 font-medium">Locations</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {warehouses.map((wh) => (
                <tr key={wh.id} className="transition-colors hover:bg-zinc-800/40">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-amber-400">
                    {wh.code}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-white">
                    {wh.name}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-400 font-mono">
                    {wh.address || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                      {wh.locations.map((loc) => (
                        <span
                          key={loc}
                          className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800 text-zinc-300"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs">
                    {wh.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-emerald-400 font-bold border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-zinc-400 font-medium border border-zinc-700">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      disabled={isPending}
                      onClick={() => handleEdit(wh)}
                      className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition disabled:opacity-50"
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleToggleStatus(wh)}
                      className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                        wh.isActive
                          ? "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      }`}
                      title={wh.isActive ? "Disable warehouse (preserves ledger data)" : "Enable warehouse"}
                    >
                      {wh.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/60 px-4 py-3 font-mono text-xs text-zinc-400">
          <span>Showing {totalWarehouses} warehouses</span>
          <span className="hidden sm:inline text-zinc-500">
            Locations with existing movements cannot be deleted; soft toggle active state instead.
          </span>
        </div>
      </div>

      {/* Warehouse Modal */}
      <WarehouseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWarehouse(null);
        }}
        warehouseToEdit={editingWarehouse}
        onSuccessToast={showToast}
      />
    </div>
  );
}
