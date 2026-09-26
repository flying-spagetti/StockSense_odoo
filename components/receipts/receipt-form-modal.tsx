"use client";

import React, { useActionState, useEffect, useState } from "react";
import { createReceipt } from "@/app/actions/receipts";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { XIcon, CheckCircleIcon } from "@/components/ui/icons";
import type { ProductRow } from "@/lib/db/queries";
import type { ReceiptFormState } from "@/lib/validation";

interface ReceiptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRow[];
  defaultReference: string;
  onSuccessToast: (msg: string) => void;
}

const initialState: ReceiptFormState = {};

export function ReceiptFormModal({
  isOpen,
  onClose,
  products,
  defaultReference,
  onSuccessToast,
}: ReceiptFormModalProps) {
  const [state, formAction, isPending] = useActionState(createReceipt, initialState);
  const [actionType, setActionType] = useState<"draft" | "validate">("draft");
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success && state.message) {
      onSuccessToast(state.message);
      onClose();
    }
  }, [state, onSuccessToast, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              New Stock Receipt
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Incoming stock movement from vendor or supplier.
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

          {errors.form ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
              {errors.form}
            </div>
          ) : null}

          {/* Reference & Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reference" htmlFor="reference" error={errors.reference} hint="Auto-generated">
              <Input
                id="reference"
                name="reference"
                defaultValue={defaultReference}
                placeholder="WH/IN/0001"
                required
              />
            </Field>

            <Field label="Supplier / Vendor" htmlFor="supplier" error={errors.supplier}>
              <Input
                id="supplier"
                name="supplier"
                defaultValue="Acme Goods Co."
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
              required
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — [{p.unit}]
                </option>
              ))}
            </select>
          </Field>

          {/* Destination & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Destination Location" htmlFor="toLocationId" error={errors.toLocationId}>
              <Input
                id="toLocationId"
                name="toLocationId"
                defaultValue="WH/Stock"
                placeholder="WH/Stock"
                required
              />
            </Field>

            <Field label="Quantity (Positive Int)" htmlFor="quantity" error={errors.quantity}>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                defaultValue={50}
                placeholder="e.g. 50"
                required
              />
            </Field>
          </div>

          {/* Optional Note */}
          <Field label="Notes / Comments (Optional)" htmlFor="note">
            <textarea
              id="note"
              name="note"
              rows={2}
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
              Save Draft
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
