"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProductFormState } from "@/lib/validation";

type ProductFormProps = {
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  submitLabel: string;
  onSuccess?: () => void;
  product?: {
    id: string;
    sku: string;
    name: string;
    category?: string;
    unit: string;
    reorderLevel: number;
  };
};

const initialState: ProductFormState = {};

export function ProductForm({
  action,
  submitLabel,
  onSuccess,
  product,
}: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state && !state.errors && onSuccess) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="grid gap-4">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {errors.form ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
          {errors.form}
        </div>
      ) : null}

      <Field label="SKU (Stock Keeping Unit)" htmlFor="sku" error={errors.sku} hint={product ? "Immutable SKU" : "Unique ID"}>
        <Input
          id="sku"
          name="sku"
          defaultValue={product?.sku}
          placeholder="e.g. SKU-1005"
          readOnly={product ? true : undefined}
          required
        />
      </Field>

      <Field label="Product Name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name}
          placeholder="e.g. Cotton T-Shirt"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" htmlFor="category" error={errors.category}>
          <Input
            id="category"
            name="category"
            defaultValue={product?.category ?? "General"}
            placeholder="e.g. Apparel"
          />
        </Field>

        <Field label="UoM (Unit)" htmlFor="unit" error={errors.unit}>
          <Input
            id="unit"
            name="unit"
            defaultValue={product?.unit ?? "pcs"}
            placeholder="e.g. pcs, kg, box"
          />
        </Field>
      </div>

      <Field
        label="Reorder Level (Alert Threshold)"
        htmlFor="reorderLevel"
        error={errors.reorderLevel}
        hint="Min quantity before alert"
      >
        <Input
          id="reorderLevel"
          name="reorderLevel"
          type="number"
          min={0}
          step={1}
          defaultValue={product?.reorderLevel ?? 0}
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Processing..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
