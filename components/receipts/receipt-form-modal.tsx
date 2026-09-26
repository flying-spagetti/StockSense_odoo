"use client";

import React, { useActionState, useEffect, useState, useMemo } from "react";
import { createReceipt, updateReceipt } from "@/app/actions/receipts";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { XIcon, CheckCircleIcon } from "@/components/ui/icons";
import type { ProductRow, InventoryRow, ReceiptDetailRow, WarehouseRow, MoveHistoryRow } from "@/lib/db/queries";
import type { ReceiptFormState } from "@/lib/validation";

interface ReceiptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRow[];
  inventory?: InventoryRow[];
  defaultReference: string;
  receiptToEdit?: ReceiptDetailRow | null;
  warehouses?: WarehouseRow[];
  movements?: MoveHistoryRow[];
  onSuccessToast: (msg: string) => void;
}

const initialState: ReceiptFormState = {};

export function ReceiptFormModal({
  isOpen,
  onClose,
  products,
  inventory = [],
  defaultReference,
  receiptToEdit,
  warehouses = [],
  movements = [],
  onSuccessToast,
}: ReceiptFormModalProps) {
  const isEditing = Boolean(receiptToEdit);
  const actionToUse = isEditing ? updateReceipt : createReceipt;
  const [state, formAction, isPending] = useActionState(actionToUse, initialState);
  const [actionType, setActionType] = useState<"draft" | "validate">("draft");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [toLocationId, setToLocationId] = useState<string>("WH/Stock");
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (receiptToEdit) {
      setSelectedProductId(receiptToEdit.productId);
      setToLocationId(receiptToEdit.toLocationId || "WH/Stock");
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setToLocationId("WH/Stock");
    }
  }, [receiptToEdit, products, selectedProductId]);

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

  useEffect(() => {
    if (state?.success && state.message) {
      onSuccessToast(state.message);
      onClose();
    }
  }, [state, onSuccessToast, onClose]);

  if (!isOpen) return null;

  const currentRef = receiptToEdit ? receiptToEdit.reference : defaultReference;
  const currentSupplier = receiptToEdit ? receiptToEdit.supplier : "Acme Goods Co.";
  const currentQuantity = receiptToEdit ? receiptToEdit.quantity : 50;
  const currentNote = receiptToEdit ? (receiptToEdit.note || "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {isEditing ? `Edit Draft Receipt (${currentRef})` : "New Stock Receipt (Incoming)"}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {isEditing
                ? "Modify draft receipt details before validation."
                : "Incoming stock movement from vendor or supplier into warehouse."}
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
          {isEditing && <input type="hidden" name="id" value={receiptToEdit!.id} />}
          <input type="hidden" name="actionType" value={actionType} />
          {isEditing && <input type="hidden" name="reference" value={currentRef} />}

          {errors.form ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
              {errors.form}
            </div>
          ) : null}

          {/* Reference & Supplier */}
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
                placeholder="WH/IN/0001"
                readOnly={isEditing}
                disabled={isEditing}
                required
                className={isEditing ? "bg-zinc-900 text-zinc-400 cursor-not-allowed border-zinc-800" : ""}
              />
            </Field>

            <Field label="Supplier / Vendor" htmlFor="supplier" error={errors.supplier}>
              <Input
                id="supplier"
                name="supplier"
                defaultValue={currentSupplier}
                placeholder="e.g. Acme Ltd."
                required
              />
            </Field>
          </div>

          {/* Product Selector */}
          <Field label="Product Item" htmlFor="productId" error={errors.productId}>
            <select
              id="productId"
              name="productId"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => {
                const invItem = inventory.find((i) => i.id === p.id);
                const totalStock = invItem ? invItem.onHand : 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Total Stock: {totalStock} {p.unit}
                  </option>
                );
              })}
            </select>
          </Field>

          {/* Destination Location Dropdown & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Destination Location" htmlFor="toLocationId" error={errors.toLocationId}>
              <select
                id="toLocationId"
                name="toLocationId"
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
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

            <Field label="Quantity (Positive Int)" htmlFor="quantity" error={errors.quantity}>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                defaultValue={currentQuantity}
                placeholder="e.g. 50"
                required
              />
            </Field>
          </div>

          {/* Warehouse Stock Breakdown Panel */}
          {selectedProductId && warehouseStockBreakdown.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-mono">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Current Stock Across All Warehouses
                </span>
                <span className="text-zinc-400">
                  Total: <strong className="text-emerald-400">{warehouseStockBreakdown.reduce((sum, b) => sum + b.onHand, 0)} {selectedProduct?.unit || "pcs"}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {warehouseStockBreakdown.map((item) => {
                  const isSelected = item.locationId === toLocationId;
                  return (
                    <div
                      key={item.locationId}
                      onClick={() => setToLocationId(item.locationId)}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-200"
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
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
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

          {/* Optional Note */}
          <Field label="Notes / Comments (Optional)" htmlFor="note">
            <textarea
              id="note"
              name="note"
              rows={2}
              defaultValue={currentNote}
              placeholder="e.g. Supplier PO #4092, batch inspection clear"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-zinc-500 font-sans"
            />
          </Field>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="submit"
              variant="secondary"
              disabled={isPending}
              onClick={() => setActionType("draft")}
              className="w-full sm:w-auto"
            >
              {isEditing ? "Update Draft" : "Save Draft"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              onClick={() => setActionType("validate")}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Validate Receipt</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
