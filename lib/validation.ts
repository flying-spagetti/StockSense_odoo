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

export type DeliveryFormState = {
  errors?: Record<string, string>;
  success?: boolean;
  message?: string;
  deliveryId?: string;
};

export type DeliveryInput = {
  productId: string;
  quantity: number;
  reference: string;
  customer: string;
  fromLocationId: string;
  toLocationId: null;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note?: string;
};

export type DeliveryFormResult =
  | { data: DeliveryInput }
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

export function parseDeliveryForm(formData: FormData): DeliveryFormResult {
  const errors: Record<string, string> = {};

  const productId = readText(formData, "productId");
  const rawQuantity = readText(formData, "quantity");
  const reference = readText(formData, "reference") || "WH/OUT/0001";
  const customer = readText(formData, "customer") || readText(formData, "supplier") || "Main Customer";
  const fromLocationId = readText(formData, "fromLocationId") || "WH/Stock";
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

  if (customer.length > 128) {
    errors.customer = "Customer name must be 128 characters or fewer.";
  }

  if (fromLocationId.length > 128) {
    errors.fromLocationId = "Source location must be 128 characters or fewer.";
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
      customer,
      fromLocationId,
      toLocationId: null,
      status,
      note: note || undefined,
    },
  };
}

export type TransferFormState = {
  errors?: Record<string, string>;
  success?: boolean;
  message?: string;
  transferId?: string;
};

export type TransferInput = {
  productId: string;
  quantity: number;
  reference: string;
  fromLocationId: string;
  toLocationId: string;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note?: string;
};

export type TransferFormResult =
  | { data: TransferInput }
  | { errors: Record<string, string> };

export function parseTransferForm(formData: FormData): TransferFormResult {
  const errors: Record<string, string> = {};

  const productId = readText(formData, "productId");
  const rawQuantity = readText(formData, "quantity");
  const reference = readText(formData, "reference") || "WH/TR/0001";
  const fromLocationId = readText(formData, "fromLocationId") || "Main Warehouse";
  const toLocationId = readText(formData, "toLocationId") || "Production Floor";
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

  if (!fromLocationId) {
    errors.fromLocationId = "Source location is required.";
  } else if (fromLocationId.length > 128) {
    errors.fromLocationId = "Source location must be 128 characters or fewer.";
  }

  if (!toLocationId) {
    errors.toLocationId = "Destination location is required.";
  } else if (toLocationId.length > 128) {
    errors.toLocationId = "Destination location must be 128 characters or fewer.";
  }

  if (
    fromLocationId &&
    toLocationId &&
    fromLocationId.trim().toLowerCase() === toLocationId.trim().toLowerCase()
  ) {
    errors.toLocationId = "Source and destination locations cannot be the same.";
    errors.form = "Source and destination locations cannot be the same.";
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
      fromLocationId,
      toLocationId,
      status,
      note: note || undefined,
    },
  };
}

export type AdjustmentFormState = {
  errors?: Record<string, string>;
  success?: boolean;
  message?: string;
  adjustmentId?: string;
};

export type AdjustmentInput = {
  productId: string;
  locationId: string;
  physicalCount: number;
  recordedStock: number;
  delta: number;
  quantity: number;
  reference: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note?: string;
};

export type AdjustmentFormResult =
  | { data: AdjustmentInput }
  | { errors: Record<string, string> };

export function parseAdjustmentForm(formData: FormData): AdjustmentFormResult {
  const errors: Record<string, string> = {};

  const productId = readText(formData, "productId");
  const locationId = readText(formData, "locationId") || "WH/Stock";
  const rawPhysicalCount = readText(formData, "physicalCount");
  const rawRecordedStock = readText(formData, "recordedStock");
  const reference = readText(formData, "reference") || "WH/ADJ/0001";
  const actionType = readText(formData, "actionType"); // "draft" or "validate" / "post"
  const note = readText(formData, "note");

  if (!productId) {
    errors.productId = "Please select a product.";
  }

  if (!locationId) {
    errors.locationId = "Location is required.";
  } else if (locationId.length > 128) {
    errors.locationId = "Location must be 128 characters or fewer.";
  }

  const physicalCount = Number(rawPhysicalCount);
  if (
    rawPhysicalCount === "" ||
    !Number.isInteger(physicalCount) ||
    physicalCount < 0
  ) {
    errors.physicalCount = "Physical count must be a non-negative whole number (0 or greater).";
  }

  const recordedStock = Number(rawRecordedStock);

  if (reference.length > 64) {
    errors.reference = "Reference must be 64 characters or fewer.";
  }

  if (
    rawPhysicalCount !== "" &&
    Number.isInteger(physicalCount) &&
    physicalCount >= 0 &&
    !isNaN(recordedStock)
  ) {
    const delta = physicalCount - recordedStock;
    if (delta === 0) {
      errors.physicalCount = "Physical count already matches recorded stock.";
      errors.form = "Physical count already matches recorded stock.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const delta = physicalCount - recordedStock;
  const quantity = Math.abs(delta);
  const fromLocationId = delta < 0 ? locationId : null;
  const toLocationId = delta > 0 ? locationId : null;
  const status: "draft" | "done" =
    actionType === "validate" || actionType === "post" ? "done" : "draft";

  return {
    data: {
      productId,
      locationId,
      physicalCount,
      recordedStock,
      delta,
      quantity,
      reference,
      fromLocationId,
      toLocationId,
      status,
      note: note || undefined,
    },
  };
}

export type WarehouseFormState = {
  errors?: Record<string, string>;
  success?: boolean;
  message?: string;
  warehouseId?: string;
};

export type WarehouseInput = {
  code: string;
  name: string;
  address?: string;
};

export type WarehouseFormResult =
  | { data: WarehouseInput }
  | { errors: Record<string, string> };

export function parseWarehouseForm(formData: FormData): WarehouseFormResult {
  const errors: Record<string, string> = {};

  const code = readText(formData, "code");
  const name = readText(formData, "name");
  const address = readText(formData, "address");

  if (!code) {
    errors.code = "Short code is required.";
  } else if (code.length > 10) {
    errors.code = "Short code must be 10 characters or fewer.";
  }

  if (!name) {
    errors.name = "Warehouse name is required.";
  } else if (name.length > 128) {
    errors.name = "Name must be 128 characters or fewer.";
  }

  if (address.length > 256) {
    errors.address = "Address must be 256 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      code,
      name,
      address: address || undefined,
    },
  };
}



