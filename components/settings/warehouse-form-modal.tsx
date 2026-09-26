"use client";

import React, { useActionState, useEffect } from "react";
import { createWarehouse, updateWarehouse } from "@/app/actions/warehouses";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { XIcon } from "@/components/ui/icons";
import type { WarehouseRow } from "@/lib/db/queries";
import type { WarehouseFormState } from "@/lib/validation";

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseToEdit?: WarehouseRow | null;
  onSuccessToast: (msg: string, isError?: boolean) => void;
}

const initialState: WarehouseFormState = {};

export function WarehouseFormModal({
  isOpen,
  onClose,
  warehouseToEdit,
  onSuccessToast,
}: WarehouseFormModalProps) {
  const isEditing = Boolean(warehouseToEdit);
  const actionToUse = isEditing ? updateWarehouse : createWarehouse;
  const [state, formAction, isPending] = useActionState(actionToUse, initialState);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success && state.message) {
      onSuccessToast(state.message);
      onClose();
    } else if (state && !state.success && state.message) {
      onSuccessToast(state.message, true);
    }
  }, [state, onSuccessToast, onClose]);

  if (!isOpen) return null;

  const currentCode = warehouseToEdit ? warehouseToEdit.code : "";
  const currentName = warehouseToEdit ? warehouseToEdit.name : "";
  const currentAddress = warehouseToEdit ? (warehouseToEdit.address || "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {isEditing ? `Edit Warehouse (${currentCode})` : "Add New Warehouse"}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Configure warehouse short code, display name, and location defaults.
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
          {isEditing && <input type="hidden" name="id" value={warehouseToEdit!.id} />}

          {errors.form ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
              {errors.form}
            </div>
          ) : null}

          {/* Short Code & Name */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Short Code" htmlFor="code" error={errors.code} hint="e.g. WH, SF, LA">
              <Input
                id="code"
                name="code"
                defaultValue={currentCode}
                placeholder="e.g. WH"
                required
                maxLength={10}
                className="font-mono uppercase"
              />
            </Field>

            <div className="col-span-2">
              <Field label="Warehouse Name" htmlFor="name" error={errors.name}>
                <Input
                  id="name"
                  name="name"
                  defaultValue={currentName}
                  placeholder="e.g. West Coast Distribution Hub"
                  required
                />
              </Field>
            </div>
          </div>

          {/* Optional Address */}
          <Field label="Address / Facility Location (Optional)" htmlFor="address" error={errors.address}>
            <Input
              id="address"
              name="address"
              defaultValue={currentAddress}
              placeholder="e.g. Building A, 100 Logistics Blvd"
            />
          </Field>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isEditing ? "Save Warehouse Changes" : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
