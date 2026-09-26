"use client";

import React, { useActionState, useEffect, useState, useMemo } from "react";
import { createTransfer, updateTransfer } from "@/app/actions/transfers";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { XIcon, CheckCircleIcon, AlertTriangleIcon, TransfersIcon } from "@/components/ui/icons";
import type { ProductRow, InventoryRow, TransferDetailRow, WarehouseRow, MoveHistoryRow } from "@/lib/db/queries";
import type { TransferFormState } from "@/lib/validation";

interface TransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRow[];
  inventory: InventoryRow[];
  defaultReference: string;
  transferToEdit?: TransferDetailRow | null;
  warehouses?: WarehouseRow[];
  movements?: MoveHistoryRow[];
  onSuccessToast: (msg: string, isError?: boolean) => void;
}

const initialState: TransferFormState = {};

export function TransferFormModal({
  isOpen,
  onClose,
  products,
  inventory,
  defaultReference,
  transferToEdit,
  warehouses = [],
  movements = [],
  onSuccessToast,
}: TransferFormModalProps) {
  const isEditing = Boolean(transferToEdit);
  const actionToUse = isEditing ? updateTransfer : createTransfer;
  const [state, formAction, isPending] = useActionState(actionToUse, initialState);
  const [actionType, setActionType] = useState<"draft" | "validate">("draft");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(20);
  const [fromLocationId, setFromLocationId] = useState<string>("WH/Stock");
  const [toLocationId, setToLocationId] = useState<string>("Production Floor");

  const errors = state?.errors ?? {};

  useEffect(() => {
    if (transferToEdit) {
      setSelectedProductId(transferToEdit.productId);
      setQuantity(transferToEdit.quantity);
      setFromLocationId(transferToEdit.fromLocationId || "WH/Stock");
      setToLocationId(transferToEdit.toLocationId || "Production Floor");
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setQuantity(20);
      setFromLocationId("WH/Stock");
      setToLocationId("Production Floor");
    }
  }, [transferToEdit, products, selectedProductId]);

  // Extract all active locations across warehouses
  const allLocations = useMemo(() => {
    const locs: { id: string; label: string; warehouseName: string }[] = [];
    warehouses.forEach((wh) => {
      if (wh.isActive) {
        wh.locations.forEach((loc) => {
          locs.push({
            id: loc,
            label: `${loc} (${wh.name})`,
            warehouseName: wh.name,
          });
        });
      }
    });

    if (locs.length === 0) {
      return [
        { id: "WH/Stock", label: "WH/Stock (Main Warehouse)", warehouseName: "Main Warehouse" },
        { id: "Production Floor", label: "Production Floor (Main Warehouse)", warehouseName: "Main Warehouse" },
        { id: "Packaging Zone", label: "Packaging Zone (Main Warehouse)", warehouseName: "Main Warehouse" },
        { id: "SF/Stock", label: "SF/Stock (San Francisco Hub)", warehouseName: "San Francisco Hub" },
        { id: "SF/Receiving", label: "SF/Receiving (San Francisco Hub)", warehouseName: "San Francisco Hub" },
      ];
    }

    return locs;
  }, [warehouses]);

  // Calculate live available stock per location for selected product
  const warehouseStockBreakdown = useMemo(() => {
    if (!selectedProductId) return [];

    const doneMoves = movements.filter(
      (m) => m.productId === selectedProductId && m.status === "done"
    );

    return allLocations.map((loc) => {
      const stock = doneMoves.reduce((acc, m) => {
        if (m.toLocationId === loc.id) return acc + m.quantity;
        if (m.fromLocationId === loc.id) return acc - m.quantity;
        return acc;
      }, 0);

      return {
        locationId: loc.id,
        warehouseName: loc.warehouseName,
        onHand: Math.max(0, stock),
      };
    });
  }, [selectedProductId, movements, allLocations]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const selectedSourceStock = useMemo(() => {
    const locItem = warehouseStockBreakdown.find((b) => b.locationId === fromLocationId);
    if (locItem) return locItem.onHand;
    const invItem = inventory.find((i) => i.id === selectedProductId);
    return invItem ? invItem.onHand : 0;
  }, [warehouseStockBreakdown, fromLocationId, inventory, selectedProductId]);

  const isSameLocation =
    fromLocationId.trim() !== "" &&
    toLocationId.trim() !== "" &&
    fromLocationId.trim().toLowerCase() === toLocationId.trim().toLowerCase();

  const isInsufficient = selectedProductId ? quantity > selectedSourceStock : false;

  useEffect(() => {
    if (state?.success && state.message) {
      onSuccessToast(state.message);
      onClose();
    } else if (state && !state.success && state.message) {
      onSuccessToast(state.message, true);
    }
  }, [state, onSuccessToast, onClose]);

  if (!isOpen) return null;

  const currentRef = transferToEdit ? transferToEdit.reference : defaultReference;
  const currentNote = transferToEdit ? (transferToEdit.note || "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <TransfersIcon className="h-5 w-5 text-indigo-400" />
              {isEditing ? `Edit Draft Transfer (${currentRef})` : "New Internal Transfer"}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {isEditing
                ? "Modify draft transfer details before validation."
                : "Move inventory between internal warehouses or operational zones."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="grid gap-4">
          {isEditing && <input type="hidden" name="id" value={transferToEdit!.id} />}
          <input type="hidden" name="actionType" value={actionType} />
          {isEditing && <input type="hidden" name="reference" value={currentRef} />}

          {/* Form Error Banner */}
          {errors.form ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300 font-mono flex items-start gap-2.5">
              <AlertTriangleIcon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-200">Validation Rejected</p>
                <p className="mt-0.5 text-red-300/90">{errors.form}</p>
              </div>
            </div>
          ) : null}

          {/* Reference & Product */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Reference"
              htmlFor="reference"
              error={errors.reference}
              hint={isEditing ? "Reference locked" : "Auto-generated"}
            >
              <Input
                id="reference"
                name="reference"
                defaultValue={currentRef}
                placeholder="WH/TR/0001"
                readOnly={isEditing}
                disabled={isEditing}
                required
                className={isEditing ? "bg-zinc-900 text-zinc-400 cursor-not-allowed border-zinc-800" : ""}
              />
            </Field>

            <Field label="Product Item" htmlFor="productId" error={errors.productId}>
              <select
                id="productId"
                name="productId"
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
              >
                {products.map((p) => {
                  const invItem = inventory.find((i) => i.id === p.id);
                  const stock = invItem ? invItem.onHand : 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Total Stock: {stock} {p.unit}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>

          {/* Source & Destination Location Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source Location" htmlFor="fromLocationId" error={errors.fromLocationId}>
              <select
                id="fromLocationId"
                name="fromLocationId"
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                required
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                {allLocations.map((loc) => {
                  const stockItem = warehouseStockBreakdown.find((b) => b.locationId === loc.id);
                  const stock = stockItem ? stockItem.onHand : 0;
                  return (
                    <option key={loc.id} value={loc.id}>
                      {loc.id} — {loc.warehouseName} ({stock} {selectedProduct?.unit || 'pcs'})
                    </option>
                  );
                })}
              </select>
            </Field>

            <Field label="Destination Location" htmlFor="toLocationId" error={errors.toLocationId || (isSameLocation ? "Cannot match source" : undefined)}>
              <select
                id="toLocationId"
                name="toLocationId"
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                required
                className={`h-9 w-full rounded-md border bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono ${
                  isSameLocation ? "border-red-500 focus:border-red-500" : "border-zinc-700"
                }`}
              >
                {allLocations.map((loc) => {
                  const stockItem = warehouseStockBreakdown.find((b) => b.locationId === loc.id);
                  const stock = stockItem ? stockItem.onHand : 0;
                  return (
                    <option key={loc.id} value={loc.id}>
                      {loc.id} — {loc.warehouseName} ({stock} {selectedProduct?.unit || 'pcs'})
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>

          {/* Quantity & Availability */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <Field
              label="Quantity to Move"
              htmlFor="quantity"
              error={errors.quantity}
              hint={`Source stock: ${selectedSourceStock} ${selectedProduct?.unit || 'pcs'}`}
            >
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="e.g. 20"
                className={isInsufficient ? "border-amber-500 focus:border-red-500" : ""}
                required
              />
            </Field>

            <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs flex flex-col justify-center h-16 mt-1">
              <span className="text-zinc-400">Source Stock @ {fromLocationId}:</span>
              <span className={`font-bold text-sm ${selectedSourceStock > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {selectedSourceStock} {selectedProduct?.unit || 'pcs'}
              </span>
            </div>
          </div>

          {/* Warehouse Stock Breakdown Panel */}
          {selectedProductId && warehouseStockBreakdown.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-mono">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  Stock Availability Across All Warehouses
                </span>
                <span className="text-zinc-400">
                  Total: <strong className="text-emerald-400">{warehouseStockBreakdown.reduce((sum, b) => sum + b.onHand, 0)} {selectedProduct?.unit || "pcs"}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {warehouseStockBreakdown.map((item) => {
                  const isSource = item.locationId === fromLocationId;
                  const isDest = item.locationId === toLocationId;

                  let borderStyle = "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700";
                  if (isSource) borderStyle = "bg-amber-500/10 border-amber-500/50 text-amber-200";
                  if (isDest) borderStyle = "bg-indigo-500/10 border-indigo-500/50 text-indigo-200";

                  return (
                    <div
                      key={item.locationId}
                      onClick={() => {
                        if (item.locationId !== fromLocationId) {
                          setToLocationId(item.locationId);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition ${borderStyle}`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-zinc-200 block truncate flex items-center gap-1">
                          {item.locationId}
                          {isSource && <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">From</span>}
                          {isDest && <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300">To</span>}
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate">{item.warehouseName}</span>
                      </div>
                      <span
                        className={`font-bold shrink-0 px-2 py-0.5 rounded text-[11px] ${
                          item.onHand > 0
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                        }`}
                      >
                        {item.onHand} {selectedProduct?.unit || "pcs"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warning Messages */}
          {isSameLocation && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 font-mono flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-red-400 shrink-0" />
              <span>Source and destination locations cannot be the same.</span>
            </div>
          )}

          {isInsufficient && !isSameLocation && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 font-mono flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Warning: Requested {quantity} {selectedProduct?.unit || 'pcs'} exceeds source stock at {fromLocationId} ({selectedSourceStock} {selectedProduct?.unit || 'pcs'}). Validation will be blocked server-side.
              </span>
            </div>
          )}

          {/* Optional Note */}
          <Field label="Notes / Reason for Transfer (Optional)" htmlFor="note">
            <textarea
              id="note"
              name="note"
              rows={2}
              defaultValue={currentNote}
              placeholder="e.g. Relocating stock to Production Floor for assembly line batch 5"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-500 font-sans"
            />
          </Field>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="submit"
              variant="secondary"
              disabled={isPending || isSameLocation}
              onClick={() => setActionType("draft")}
              className="w-full sm:w-auto"
            >
              {isEditing ? "Update Draft" : "Save Draft"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || isSameLocation}
              onClick={() => setActionType("validate")}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Validate Transfer</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
