"use client";

import { useActionState } from "react";
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
  product?: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    reorderLevel: number;
  };
};

const initialState: ProductFormState = {};

export function ProductForm({
  action,
  submitLabel,
  product,
}: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {errors.form ? (
        <p className="text-sm text-red-600">{errors.form}</p>
      ) : null}

      <Field label="SKU" htmlFor="sku" error={errors.sku}>
        <Input
          id="sku"
          name="sku"
          defaultValue={product?.sku}
          placeholder="SKU-1001"
          readOnly={product ? true : undefined}
          required
        />
      </Field>

      <Field label="Name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name}
          placeholder="Cotton T-Shirt"
          required
        />
      </Field>

      <Field label="Unit" htmlFor="unit" error={errors.unit}>
        <Input
          id="unit"
          name="unit"
          defaultValue={product?.unit ?? "unit"}
          placeholder="pcs"
        />
      </Field>

      <Field
        label="Reorder level"
        htmlFor="reorderLevel"
        error={errors.reorderLevel}
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

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
