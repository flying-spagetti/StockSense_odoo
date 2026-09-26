export type ProductFormState = {
  errors?: Record<string, string>;
};

export type ProductInput = {
  sku: string;
  name: string;
  unit: string;
  reorderLevel: number;
};

export type ProductFormResult =
  | { data: ProductInput }
  | { errors: Record<string, string> };

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseProductForm(formData: FormData): ProductFormResult {
  const errors: Record<string, string> = {};

  const sku = readText(formData, "sku");
  const name = readText(formData, "name");
  const unit = readText(formData, "unit") || "unit";
  const rawReorderLevel = readText(formData, "reorderLevel");

  if (!sku) {
    errors.sku = "SKU is required.";
  } else if (sku.length > 64) {
    errors.sku = "SKU must be 64 characters or fewer.";
  }

  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 200) {
    errors.name = "Name must be 200 characters or fewer.";
  }

  if (unit.length > 32) {
    errors.unit = "Unit must be 32 characters or fewer.";
  }

  const reorderLevel = Number(rawReorderLevel);
  if (rawReorderLevel === "" || !Number.isInteger(reorderLevel) || reorderLevel < 0) {
    errors.reorderLevel = "Reorder level must be a whole number of 0 or more.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { data: { sku, name, unit, reorderLevel } };
}
