"use client";

import React, { useActionState, useEffect, useState, useMemo } from "react";
import { createTransfer, updateTransfer } from "@/app/actions/transfers";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { XIcon, CheckCircleIcon, AlertTriangleIcon, TransfersIcon } from "@/components/ui/icons";
import type { ProductRow, InventoryRow, TransferDetailRow } from "@/lib/db/queries";
import type { TransferFormState } from "@/lib/validation";

interface TransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRow[];
  inventory: InventoryRow[];
  defaultReference: string;
  transferToEdit?: TransferDetailRow | null;
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
  onSuccessToast,
}: TransferFormModalProps) {
  const isEditing = Boolean(transferToEdit);
  const actionToUse = isEditing ? updateTransfer : createTransfer;
  const [state, formAction, isPending] = useActionState(actionToUse, initialState);
  const [actionType, setActionType] = useState<"draft" | "validate">("draft");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(20);
  const [fromLocationId, setFromLocationId] = useState<string>("Main Warehouse");
  const [toLocationId, setToLocationId] = useState<string>("Production Floor");

  const errors = state?.errors ?? {};

  useEffect(() => {
    if (transferToEdit) {
      setSelectedProductId(transferToEdit.productId);
      setQuantity(transferToEdit.quantity);
      setFromLocationId(transferToEdit.fromLocationId || "Main Warehouse");
      setToLocationId(transferToEdit.toLocationId || "Production Floor");
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setQuantity(20);
      setFromLocationId("Main Warehouse");
      setToLocationId("Production Floor");
    }
  }, [transferToEdit, products]);

  // Calculate live available stock for selected product
  const availableStock = useMemo(() => {
    if (!selectedProductId) return 0;
    const item = inventory.find((inv) => inv.id === selectedProductId);
    return item ? item.onHand : 0;
  }, [inventory, selectedProductId]);

  const isSameLocation =
    fromLocationId.trim() !== "" &&
    toLocationId.trim() !== "" &&
    fromLocationId.trim().toLowerCase() === toLocationId.trim().toLowerCase();

  const isInsufficient = selectedProductId ? quantity > availableStock : false;

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
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
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
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {products.map((p) => {
                  const invItem = inventory.find((i) => i.id === p.id);
                  const stock = invItem ? invItem.onHand : 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Avail: {stock} {p.unit}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>

          {/* Source & Destination Locations */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source Location" htmlFor="fromLocationId" error={errors.fromLocationId}>
              <Input
                id="fromLocationId"
                name="fromLocationId"
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                placeholder="Main Warehouse"
                required
              />
            </Field>

            <Field label="Destination Location" htmlFor="toLocationId" error={errors.toLocationId || (isSameLocation ? "Cannot match source" : undefined)}>
              <Input
                id="toLocationId"
                name="toLocationId"
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                placeholder="Production Floor"
                className={isSameLocation ? "border-red-500 focus:border-red-500" : ""}
                required
              />
            </Field>
          </div>

          {/* Quantity & Availability Indicator */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <Field
              label="Quantity to Move"
              htmlFor="quantity"
              error={errors.quantity}
              hint={`Source stock: ${availableStock}`}
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
              <span className="text-zinc-400">Source Availability:</span>
              <span className={`font-bold text-sm ${availableStock > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {availableStock} pcs @ {fromLocationId || "Source"}
              </span>
            </div>
          </div>

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
                Warning: Requested {quantity} pcs exceeds current source stock ({availableStock} pcs). Validation will be blocked server-side.
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
