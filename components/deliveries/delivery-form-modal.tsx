"use client";

import React, { useActionState, useEffect, useState, useMemo } from "react";
import { createDelivery, updateDelivery } from "@/app/actions/deliveries";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { XIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";
import type { ProductRow, InventoryRow, DeliveryDetailRow } from "@/lib/db/queries";
import type { DeliveryFormState } from "@/lib/validation";

interface DeliveryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRow[];
  inventory: InventoryRow[];
  defaultReference: string;
  deliveryToEdit?: DeliveryDetailRow | null;
  onSuccessToast: (msg: string, isError?: boolean) => void;
}

const initialState: DeliveryFormState = {};

export function DeliveryFormModal({
  isOpen,
  onClose,
  products,
  inventory,
  defaultReference,
  deliveryToEdit,
  onSuccessToast,
}: DeliveryFormModalProps) {
  const isEditing = Boolean(deliveryToEdit);
  const actionToUse = isEditing ? updateDelivery : createDelivery;
  const [state, formAction, isPending] = useActionState(actionToUse, initialState);
  const [actionType, setActionType] = useState<"draft" | "validate">("draft");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(10);
  const [fromLocationId, setFromLocationId] = useState<string>("WH/Stock");

  const errors = state?.errors ?? {};

  useEffect(() => {
    if (deliveryToEdit) {
      setSelectedProductId(deliveryToEdit.productId);
      setQuantity(deliveryToEdit.quantity);
      setFromLocationId(deliveryToEdit.fromLocationId || "WH/Stock");
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setQuantity(10);
      setFromLocationId("WH/Stock");
    }
  }, [deliveryToEdit, products]);

  // Calculate live available stock for selected product
  const availableStock = useMemo(() => {
    if (!selectedProductId) return 0;
    const item = inventory.find((inv) => inv.id === selectedProductId);
    return item ? item.onHand : 0;
  }, [inventory, selectedProductId]);

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

  const currentRef = deliveryToEdit ? deliveryToEdit.reference : defaultReference;
  const currentCustomer = deliveryToEdit ? deliveryToEdit.customer : "Apex Logistics";
  const currentNote = deliveryToEdit ? (deliveryToEdit.note || "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {isEditing ? `Edit Draft Delivery (${currentRef})` : "New Delivery Order (Outgoing)"}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {isEditing
                ? "Modify draft delivery order details before validation."
                : "Fulfill customer sales order and issue stock from warehouse."}
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
          {isEditing && <input type="hidden" name="id" value={deliveryToEdit!.id} />}
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

          {/* Reference & Customer */}
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
                placeholder="WH/OUT/0001"
                readOnly={isEditing}
                disabled={isEditing}
                required
                className={isEditing ? "bg-zinc-900 text-zinc-400 cursor-not-allowed border-zinc-800" : ""}
              />
            </Field>

            <Field label="Customer / Destination" htmlFor="customer" error={errors.customer}>
              <Input
                id="customer"
                name="customer"
                defaultValue={currentCustomer}
                placeholder="e.g. Apex Corp"
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
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {products.map((p) => {
                const invItem = inventory.find((i) => i.id === p.id);
                const stock = invItem ? invItem.onHand : 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Available: {stock} {p.unit}
                  </option>
                );
              })}
            </select>
          </Field>

          {/* Source Location & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source Location" htmlFor="fromLocationId" error={errors.fromLocationId}>
              <Input
                id="fromLocationId"
                name="fromLocationId"
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                placeholder="WH/Stock"
                required
              />
            </Field>

            <Field
              label="Quantity"
              htmlFor="quantity"
              error={errors.quantity}
              hint={`Avail: ${availableStock} pcs`}
            >
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="e.g. 10"
                className={isInsufficient ? "border-amber-500 focus:border-red-500 focus:ring-red-500" : ""}
                required
              />
            </Field>
          </div>

          {/* Availability Indicator & Warning Badge */}
          <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs flex items-center justify-between">
            <span className="text-zinc-400">
              Source Availability at <span className="text-zinc-200">{fromLocationId || "WH/Stock"}</span>:
            </span>
            <span className={`font-bold ${availableStock > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {availableStock} pcs
            </span>
          </div>

          {isInsufficient && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 font-mono flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Warning: Requested {quantity} pcs exceeds current stock ({availableStock} pcs). Validation will be rejected server-side.
              </span>
            </div>
          )}

          {/* Optional Note */}
          <Field label="Notes / Dispatch Instructions (Optional)" htmlFor="note">
            <textarea
              id="note"
              name="note"
              rows={2}
              defaultValue={currentNote}
              placeholder="e.g. Expedited courier dispatch, Dock 4"
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
              <span>Validate Delivery</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
