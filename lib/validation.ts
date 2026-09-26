export type ProductFormState = {
  errors?: Record<string, string>;
  message?: string;
};

export type ProductInput = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  reorderLevel: number;
};

export type ProductFormResult =
  | { data: ProductInput }
  | { errors: Record<string, string> };

export type ReceiptFormState = {
  errors?: Record<string, string>;
  success?: boolean;
  message?: string;
  receiptId?: string;
};

export type ReceiptInput = {
  productId: string;
  quantity: number;
  reference: string;
  supplier: string;
  toLocationId: string;
  fromLocationId: null;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note?: string;
};

export type ReceiptFormResult =
  | { data: ReceiptInput }
  | { errors: Record<string, string> };

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseProductForm(formData: FormData): ProductFormResult {
  const errors: Record<string, string> = {};

  const sku = readText(formData, "sku");
  const name = readText(formData, "name");
  const category = readText(formData, "category") || "General";
  const unit = readText(formData, "unit") || "pcs";
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

  if (category.length > 64) {
    errors.category = "Category must be 64 characters or fewer.";
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

  return { data: { sku, name, category, unit, reorderLevel } };
}

export function parseReceiptForm(formData: FormData): ReceiptFormResult {
  const errors: Record<string, string> = {};

  const productId = readText(formData, "productId");
  const rawQuantity = readText(formData, "quantity");
  const reference = readText(formData, "reference") || "WH/IN/0001";
  const supplier = readText(formData, "supplier") || "Main Supplier";
  const toLocationId = readText(formData, "toLocationId") || "WH/Stock";
  const actionType = readText(formData, "actionType"); // "draft" or "validate"
  const note = readText(formData, "note");

  if (!productId) {
    errors.productId = "Please select a product.";
  }

  const quantity = Number(rawQuantity);
  if (rawQuantity === "" || !Number.isInteger(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be a positive whole number greater than 0.";
  }

  if (reference.length > 64) {
    errors.reference = "Reference must be 64 characters or fewer.";
  }

  if (supplier.length > 128) {
    errors.supplier = "Supplier name must be 128 characters or fewer.";
  }

  if (toLocationId.length > 128) {
    errors.toLocationId = "Destination must be 128 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const status: "draft" | "done" = actionType === "validate" ? "done" : "draft";

  return {
    data: {
      productId,
      quantity,
      reference,
      supplier,
      toLocationId,
      fromLocationId: null,
      status,
      note: note || undefined,
    },
  };
}
