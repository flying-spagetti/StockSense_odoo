"use client";

import React, { useActionState, useEffect, useState, useMemo } from "react";
import { createAdjustment } from "@/app/actions/adjustments";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { XIcon, CheckCircleIcon, AlertTriangleIcon, AdjustmentsIcon } from "@/components/ui/icons";
import type { ProductRow, InventoryRow } from "@/lib/db/queries";
import type { AdjustmentFormState } from "@/lib/validation";

interface AdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRow[];
  inventory: InventoryRow[];
  defaultReference: string;
  onSuccessToast: (msg: string, isError?: boolean) => void;
}

const initialState: AdjustmentFormState = {};

export function AdjustmentFormModal({
  isOpen,
  onClose,
  products,
  inventory,
  defaultReference,
  onSuccessToast,
}: AdjustmentFormModalProps) {
  const [state, formAction, isPending] = useActionState(createAdjustment, initialState);
  const [actionType, setActionType] = useState<"draft" | "validate">("draft");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("WH/Stock");
  const [physicalCount, setPhysicalCount] = useState<number>(0);

  const errors = state?.errors ?? {};

  // Calculate live recorded stock for selected product
  const recordedStock = useMemo(() => {
    if (!selectedProductId) return 0;
    const item = inventory.find((inv) => inv.id === selectedProductId);
    return item ? item.onHand : 0;
  }, [inventory, selectedProductId]);

  // Set default physical count when product changes
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      const firstItem = inventory.find((inv) => inv.id === products[0].id);
      setPhysicalCount(firstItem ? firstItem.onHand + 5 : 10);
    }
  }, [products, inventory, selectedProductId]);

  // When product changes, update physical count to recorded + 5 by default for demo ease
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const item = inventory.find((inv) => inv.id === prodId);
    const rec = item ? item.onHand : 0;
    setPhysicalCount(rec + 5);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <AdjustmentsIcon className="h-5 w-5 text-amber-400" />
              New Stock Adjustment
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Reconcile physical inventory count against system recorded stock.
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
          <input type="hidden" name="actionType" value={actionType} />
          <input type="hidden" name="recordedStock" value={recordedStock} />

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

          {/* Reference & Location */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reference" htmlFor="reference" error={errors.reference} hint="Auto-generated">
              <Input
                id="reference"
                name="reference"
                defaultValue={defaultReference}
                placeholder="WH/ADJ/0001"
                required
              />
            </Field>

            <Field label="Location" htmlFor="locationId" error={errors.locationId}>
              <Input
                id="locationId"
                name="locationId"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="WH/Stock"
                required
              />
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
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {products.map((p) => {
                const invItem = inventory.find((i) => i.id === p.id);
                const stock = invItem ? invItem.onHand : 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Recorded: {stock} {p.unit}
                  </option>
                );
              })}
            </select>
          </Field>

          {/* Stock Quantities & Live Delta Preview */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current Recorded Stock" htmlFor="recordedStockDisplay" hint="Calculated read-only">
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
              Save Draft
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
