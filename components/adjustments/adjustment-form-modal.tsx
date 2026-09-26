"use client";

import React, { useActionState, useEffect, useState, useMemo } from "react";
import { createAdjustment, updateAdjustment } from "@/app/actions/adjustments";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { XIcon, CheckCircleIcon, AlertTriangleIcon, AdjustmentsIcon } from "@/components/ui/icons";
import type { ProductRow, InventoryRow, AdjustmentDetailRow, WarehouseRow, MoveHistoryRow } from "@/lib/db/queries";
import type { AdjustmentFormState } from "@/lib/validation";

interface AdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRow[];
  inventory: InventoryRow[];
  defaultReference: string;
  adjustmentToEdit?: AdjustmentDetailRow | null;
  warehouses?: WarehouseRow[];
  movements?: MoveHistoryRow[];
  onSuccessToast: (msg: string, isError?: boolean) => void;
}

const initialState: AdjustmentFormState = {};

export function AdjustmentFormModal({
  isOpen,
  onClose,
  products,
  inventory,
  defaultReference,
  adjustmentToEdit,
  warehouses = [],
  movements = [],
  onSuccessToast,
}: AdjustmentFormModalProps) {
  const isEditing = Boolean(adjustmentToEdit);
  const actionToUse = isEditing ? updateAdjustment : createAdjustment;
  const [state, formAction, isPending] = useActionState(actionToUse, initialState);
  const [actionType, setActionType] = useState<"draft" | "validate">("draft");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("WH/Stock");
  const [physicalCount, setPhysicalCount] = useState<number>(0);

  const errors = state?.errors ?? {};

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

  // Calculate live recorded stock for selected product at selected location
  const recordedStock = useMemo(() => {
    if (!selectedProductId) return 0;
    const locItem = warehouseStockBreakdown.find((b) => b.locationId === locationId);
    if (locItem) return locItem.onHand;
    const item = inventory.find((inv) => inv.id === selectedProductId);
    return item ? item.onHand : 0;
  }, [selectedProductId, locationId, warehouseStockBreakdown, inventory]);

  useEffect(() => {
    if (adjustmentToEdit) {
      setSelectedProductId(adjustmentToEdit.productId);
      setLocationId(adjustmentToEdit.locationId || "WH/Stock");
      setPhysicalCount(adjustmentToEdit.physicalCount);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setLocationId("WH/Stock");
      const firstItem = inventory.find((inv) => inv.id === products[0].id);
      setPhysicalCount(firstItem ? firstItem.onHand + 5 : 10);
    }
  }, [adjustmentToEdit, products, inventory, selectedProductId]);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    if (!adjustmentToEdit) {
      const locItem = warehouseStockBreakdown.find((b) => b.locationId === locationId);
      const rec = locItem ? locItem.onHand : (inventory.find((inv) => inv.id === prodId)?.onHand ?? 0);
      setPhysicalCount(rec + 5);
    }
  };

  const delta = physicalCount - recordedStock;
  const isZeroDelta = delta === 0;

  useEffect(() => {
    if (state?.success && state.message) {
      onSuccessToast(state.message);
      onClose();
    } else if (state && !state.success && state.message) {
      onSuccessToast(state.message, true);
    }
  }, [state, onSuccessToast, onClose]);

  if (!isOpen) return null;

  const currentRef = adjustmentToEdit ? adjustmentToEdit.reference : defaultReference;
  const currentNote = adjustmentToEdit ? (adjustmentToEdit.note || "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <AdjustmentsIcon className="h-5 w-5 text-amber-400" />
              {isEditing ? `Edit Draft Adjustment (${currentRef})` : "New Stock Adjustment"}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {isEditing
                ? "Modify draft physical inventory count before posting."
                : "Reconcile physical inventory count against system recorded stock."}
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
          {isEditing && <input type="hidden" name="id" value={adjustmentToEdit!.id} />}
          <input type="hidden" name="actionType" value={actionType} />
          <input type="hidden" name="recordedStock" value={recordedStock} />
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

          {/* Reference & Location Dropdown */}
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
                placeholder="WH/ADJ/0001"
                readOnly={isEditing}
                disabled={isEditing}
                required
                className={isEditing ? "bg-zinc-900 text-zinc-400 cursor-not-allowed border-zinc-800" : ""}
              />
            </Field>

            <Field label="Audit Location" htmlFor="locationId" error={errors.locationId}>
              <select
                id="locationId"
                name="locationId"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
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

          {/* Product Selector */}
          <Field label="Product Item" htmlFor="productId" error={errors.productId}>
            <select
              id="productId"
              name="productId"
              required
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans"
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

          {/* Stock Quantities & Live Delta Preview */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Recorded Stock @ ${locationId}`} htmlFor="recordedStockDisplay" hint="Calculated for location">
              <Input
                id="recordedStockDisplay"
                type="number"
                value={recordedStock}
                readOnly
                className="bg-zinc-950/80 text-zinc-400 font-bold border-zinc-800 cursor-not-allowed"
              />
            </Field>

            <Field label="Physical Counted Quantity" htmlFor="physicalCount" error={errors.physicalCount}>
              <Input
                id="physicalCount"
                name="physicalCount"
                type="number"
                min={0}
                step={1}
                value={physicalCount}
                onChange={(e) => setPhysicalCount(Number(e.target.value))}
                placeholder="Enter physical count"
                className={isZeroDelta ? "border-amber-500/80" : ""}
                required
              />
            </Field>
          </div>

          {/* Warehouse Stock Breakdown Panel */}
          {selectedProductId && warehouseStockBreakdown.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-mono">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Stock Breakdown Across All Warehouses
                </span>
                <span className="text-zinc-400">
                  Total: <strong className="text-emerald-400">{warehouseStockBreakdown.reduce((sum, b) => sum + b.onHand, 0)} {selectedProduct?.unit || "pcs"}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {warehouseStockBreakdown.map((item) => {
                  const isSelected = item.locationId === locationId;
                  return (
                    <div
                      key={item.locationId}
                      onClick={() => setLocationId(item.locationId)}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/50 text-amber-200"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-zinc-200 block truncate">{item.locationId}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">{item.warehouseName}</span>
                      </div>
                      <span
                        className={`font-bold shrink-0 px-2 py-0.5 rounded text-[11px] ${
                          item.onHand > 0
                            ? isSelected
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
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

          {/* Delta Calculation Card */}
          <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3.5 font-mono text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Computed Stock Delta:</span>
              <span
                className={`font-bold text-sm px-2 py-0.5 rounded border ${
                  delta > 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : delta < 0
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                {delta > 0 ? `+${delta} (Surplus)` : delta < 0 ? `${delta} (Deficit)` : "0 (No Change)"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Formula: Physical Count ({physicalCount}) − Recorded ({recordedStock}) = Delta ({delta > 0 ? `+${delta}` : delta})
            </p>
          </div>

          {isZeroDelta && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 font-mono flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Physical count already matches recorded stock. Adjustment requires non-zero delta.</span>
            </div>
          )}

          {/* Optional Note */}
          <Field label="Audit Reason / Notes (Optional)" htmlFor="note">
            <textarea
              id="note"
              name="note"
              rows={2}
              defaultValue={currentNote}
              placeholder="e.g. Annual stock count reconciliation, damaged box discard"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-zinc-500 font-sans"
            />
          </Field>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="submit"
              variant="secondary"
              disabled={isPending || isZeroDelta}
              onClick={() => setActionType("draft")}
              className="w-full sm:w-auto"
            >
              {isEditing ? "Update Draft" : "Save Draft"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || isZeroDelta}
              onClick={() => setActionType("validate")}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Post Adjustment</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
