import { and, eq, or, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { products, stockMovements, warehouses, users } from "./schema";

export type ProductRow = typeof products.$inferSelect;

export class DuplicateSkuError extends Error {
  constructor(sku: string) {
    super(`A product with the SKU "${sku}" already exists.`);
    this.name = "DuplicateSkuError";
  }
}

export type InventoryRow = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  reorderLevel: number;
  onHand: number;
};

export type ReceiptDetailRow = {
  id: string;
  reference: string;
  supplier: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: string;
  quantity: number;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  fromLocationId: string | null;
  toLocationId: string | null;
  note: string | null;
  createdAt: Date;
};

export type DeliveryDetailRow = {
  id: string;
  reference: string;
  customer: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: string;
  quantity: number;
  availableStock: number;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  fromLocationId: string | null;
  toLocationId: string | null;
  note: string | null;
  createdAt: Date;
};

export type TransferDetailRow = {
  id: string;
  reference: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: string;
  quantity: number;
  availableStock: number;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  fromLocationId: string;
  toLocationId: string;
  note: string | null;
  createdAt: Date;
};

export type AdjustmentDetailRow = {
  id: string;
  reference: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: string;
  locationId: string;
  recordedStock: number;
  physicalCount: number;
  delta: number;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note: string | null;
  createdAt: Date;
};

export type MoveHistoryRow = {
  id: string;
  reference: string;
  kind: "receipt" | "issue" | "transfer" | "adjustment";
  typeLabel: "Receipt" | "Delivery" | "Transfer" | "Adjustment";
  productId: string;
  productName: string;
  productSku: string;
  productCategory: string;
  productUnit: string;
  supplierOrCustomer: string | null;
  fromLocationId: string | null;
  toLocationId: string | null;
  quantity: number;
  signedQuantity: number;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note: string | null;
  createdAt: Date;
};

// In-memory fallback store for offline/demo/testing environments
const fallbackProducts: ProductRow[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    sku: "SKU-1001",
    name: "Cotton T-Shirt",
    category: "Apparel",
    unit: "pcs",
    reorderLevel: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    sku: "SKU-1002",
    name: "Ceramic Mug",
    category: "Homeware",
    unit: "pcs",
    reorderLevel: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    sku: "SKU-1003",
    name: "A5 Notebook",
    category: "Stationery",
    unit: "pcs",
    reorderLevel: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    sku: "SKU-1004",
    name: "Desk Lamp",
    category: "Electronics",
    unit: "pcs",
    reorderLevel: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

type ExtendedMovement = {
  id: string;
  reference: string;
  supplier: string;
  productId: string;
  kind: "receipt" | "issue" | "transfer" | "adjustment";
  quantity: number;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  fromLocationId: string | null;
  toLocationId: string | null;
  note?: string;
  createdAt: Date;
};

const fallbackAdjustmentMovements: ExtendedMovement[] = [
  {
    id: "a1",
    reference: "WH/ADJ/0001",
    supplier: "Stock Audit",
    productId: "10000000-0000-0000-0000-000000000001",
    kind: "adjustment",
    quantity: 5,
    status: "done",
    fromLocationId: null,
    toLocationId: "WH/Stock",
    note: "Annual physical inventory surplus audit",
    createdAt: new Date("2026-09-25T14:00:00Z"),
  },
  {
    id: "a2",
    reference: "WH/ADJ/0002",
    supplier: "Stock Audit",
    productId: "10000000-0000-0000-0000-000000000002",
    kind: "adjustment",
    quantity: 2,
    status: "draft",
    fromLocationId: "WH/Stock",
    toLocationId: null,
    note: "Damaged item count pending manager signoff",
    createdAt: new Date("2026-09-26T11:00:00Z"),
  },
];

const fallbackTransferMovements: ExtendedMovement[] = [
  {
    id: "t1",
    reference: "WH/TR/0001",
    supplier: "Internal Transfer",
    productId: "10000000-0000-0000-0000-000000000001",
    kind: "transfer",
    quantity: 20,
    status: "done",
    fromLocationId: "WH/Stock",
    toLocationId: "Production Floor",
    note: "Raw material transfer for batch #42",
    createdAt: new Date("2026-09-25T11:00:00Z"),
  },
  {
    id: "t2",
    reference: "WH/TR/0002",
    supplier: "Internal Transfer",
    productId: "10000000-0000-0000-0000-000000000002",
    kind: "transfer",
    quantity: 15,
    status: "draft",
    fromLocationId: "WH/Stock",
    toLocationId: "Packaging Zone",
    note: "Pending transfer approval",
    createdAt: new Date("2026-09-26T10:15:00Z"),
  },
];

const fallbackReceiptMovements: ExtendedMovement[] = [
  {
    id: "r1",
    reference: "WH/IN/0001",
    supplier: "Acme Supplies Ltd.",
    productId: "10000000-0000-0000-0000-000000000001",
    kind: "receipt",
    quantity: 100,
    status: "done",
    fromLocationId: null,
    toLocationId: "WH/Stock",
    note: "Opening stock receipt",
    createdAt: new Date("2026-09-20T10:00:00Z"),
  },
  {
    id: "r2",
    reference: "WH/IN/0002",
    supplier: "Global Ceramics Co.",
    productId: "10000000-0000-0000-0000-000000000002",
    kind: "receipt",
    quantity: 200,
    status: "done",
    fromLocationId: null,
    toLocationId: "WH/Stock",
    note: "Bulk mug order",
    createdAt: new Date("2026-09-22T14:30:00Z"),
  },
  {
    id: "r3",
    reference: "WH/IN/0003",
    supplier: "PaperWorks Inc.",
    productId: "10000000-0000-0000-0000-000000000003",
    kind: "receipt",
    quantity: 300,
    status: "done",
    fromLocationId: null,
    toLocationId: "WH/Stock",
    note: "Notebook shipment",
    createdAt: new Date("2026-09-24T09:15:00Z"),
  },
  {
    id: "r4",
    reference: "WH/IN/0004",
    supplier: "Nordic Apparel Corp",
    productId: "10000000-0000-0000-0000-000000000001",
    kind: "receipt",
    quantity: 50,
    status: "draft",
    fromLocationId: null,
    toLocationId: "WH/Stock",
    note: "Pending inspection",
    createdAt: new Date("2026-09-26T08:00:00Z"),
  },
];

const fallbackIssueMovements: ExtendedMovement[] = [
  {
    id: "i1",
    reference: "WH/OUT/0001",
    supplier: "Apex Logistics",
    productId: "10000000-0000-0000-0000-000000000001",
    kind: "issue",
    quantity: 30,
    status: "done",
    fromLocationId: "WH/Stock",
    toLocationId: null,
    note: "Retail store fulfillment",
    createdAt: new Date("2026-09-21T11:00:00Z"),
  },
  {
    id: "i2",
    reference: "WH/OUT/0002",
    supplier: "Cafe Central",
    productId: "10000000-0000-0000-0000-000000000002",
    kind: "issue",
    quantity: 180,
    status: "done",
    fromLocationId: "WH/Stock",
    toLocationId: null,
    note: "Commercial mug delivery",
    createdAt: new Date("2026-09-23T16:00:00Z"),
  },
  {
    id: "i3",
    reference: "WH/OUT/0003",
    supplier: "City Library",
    productId: "10000000-0000-0000-0000-000000000003",
    kind: "issue",
    quantity: 50,
    status: "draft",
    fromLocationId: "WH/Stock",
    toLocationId: null,
    note: "Draft dispatch order",
    createdAt: new Date("2026-09-26T09:30:00Z"),
  },
];

export async function listProducts(): Promise<ProductRow[]> {
  try {
    return await db.select().from(products).orderBy(products.name);
  } catch (_e) {
    return [...fallbackProducts].sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (rows.length > 0) return rows[0];
  } catch (_e) {
    // fallback
  }
  return fallbackProducts.find((p) => p.id === id) ?? null;
}

export async function insertProduct(values: {
  sku: string;
  name: string;
  category?: string;
  unit: string;
  reorderLevel: number;
  initialStock?: number;
}): Promise<ProductRow> {
  const { initialStock, ...productValues } = values;
  const skuExistsFallback = fallbackProducts.some(
    (p) => p.sku.toLowerCase() === productValues.sku.toLowerCase(),
  );

  let createdProd: ProductRow;

  try {
    const rows = await db
      .insert(products)
      .values({
        ...productValues,
        category: productValues.category || "General",
      })
      .onConflictDoNothing()
      .returning();

    if (rows.length === 0) {
      throw new DuplicateSkuError(productValues.sku);
    }

    fallbackProducts.push(rows[0]);
    createdProd = rows[0];
  } catch (error) {
    if (error instanceof DuplicateSkuError) {
      throw error;
    }
    if (skuExistsFallback) {
      throw new DuplicateSkuError(productValues.sku);
    }
    const newProduct: ProductRow = {
      id: crypto.randomUUID(),
      sku: productValues.sku,
      name: productValues.name,
      category: productValues.category || "General",
      unit: productValues.unit,
      reorderLevel: productValues.reorderLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    fallbackProducts.push(newProduct);
    createdProd = newProduct;
  }

  // If initial stock was provided and is positive -> create Opening Balance receipt
  if (initialStock && initialStock > 0) {
    try {
      const ref = await getNextReceiptReference();
      await insertReceipt({
        productId: createdProd.id,
        quantity: initialStock,
        reference: ref,
        supplier: "Opening Balance",
        toLocationId: "WH/Stock",
        fromLocationId: null,
        status: "done",
        note: `Initial opening stock created during product onboarding (${createdProd.name})`,
      });
    } catch (_e) {
      // ignore
    }
  }

  return createdProd;
}

export async function updateProductById(
  id: string,
  values: { name: string; category?: string; unit: string; reorderLevel: number },
): Promise<ProductRow | null> {
  try {
    const rows = await db
      .update(products)
      .set({ ...values, category: values.category || "General", updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackProducts.findIndex((p) => p.id === id);
      if (idx !== -1) fallbackProducts[idx] = rows[0];
      return rows[0];
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackProducts.findIndex((p) => p.id === id);
  if (idx !== -1) {
    fallbackProducts[idx] = {
      ...fallbackProducts[idx],
      name: values.name,
      category: values.category || "General",
      unit: values.unit,
      reorderLevel: values.reorderLevel,
      updatedAt: new Date(),
    };
    return fallbackProducts[idx];
  }

  return null;
}

export async function deleteProductById(id: string): Promise<boolean> {
  try {
    const rows = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    if (rows.length > 0) {
      const idx = fallbackProducts.findIndex((p) => p.id === id);
      if (idx !== -1) fallbackProducts.splice(idx, 1);
      return true;
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackProducts.findIndex((p) => p.id === id);
  if (idx !== -1) {
    fallbackProducts.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Calculate available quantity for a product at a source location using ONLY done movements.
 */
export async function getProductStockAtLocation(
  productId: string,
  locationId?: string | null,
): Promise<number> {
  try {
    if (locationId) {
      const rows = await db
        .select({
          onHand: sql<number>`coalesce(
            sum(
              case
                when ${stockMovements.toLocationId} = ${locationId} then ${stockMovements.quantity}
                when ${stockMovements.fromLocationId} = ${locationId} then -${stockMovements.quantity}
                else 0
              end
            ),
            0
          )::int`,
        })
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.productId, productId),
            eq(stockMovements.status, "done"),
          ),
        );

      if (rows.length > 0 && typeof rows[0].onHand === "number") {
        return Math.max(0, rows[0].onHand);
      }
    } else {
      const rows = await db
        .select({
          onHand: sql<number>`coalesce(
            sum(
              case
                when ${stockMovements.kind} = 'receipt' then ${stockMovements.quantity}
                when ${stockMovements.kind} = 'issue' then -${stockMovements.quantity}
                else 0
              end
            ),
            0
          )::int`,
        })
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.productId, productId),
            eq(stockMovements.status, "done"),
          ),
        );

      if (rows.length > 0 && typeof rows[0].onHand === "number") {
        return Math.max(0, rows[0].onHand);
      }
    }
  } catch (_e) {
    // fallback
  }

  const allMoves = [
    ...fallbackReceiptMovements,
    ...fallbackIssueMovements,
    ...fallbackTransferMovements,
    ...fallbackAdjustmentMovements,
  ];
  const doneMoves = allMoves.filter(
    (m) => m.productId === productId && m.status === "done",
  );

  const total = doneMoves.reduce((sum, m) => {
    if (locationId) {
      if (m.toLocationId === locationId) return sum + m.quantity;
      if (m.fromLocationId === locationId) return sum - m.quantity;
      return sum;
    }
    if (m.toLocationId !== null && m.fromLocationId === null) return sum + m.quantity;
    if (m.fromLocationId !== null && m.toLocationId === null) return sum - m.quantity;
    return sum;
  }, 0);

  return Math.max(0, total);
}

/**
 * Inventory is derived, never stored. Only movements with status 'done'
 * contribute: receipts add, issues subtract, and a product with no done
 * movements reports zero.
 */
export async function listInventory(): Promise<InventoryRow[]> {
  try {
    const dbInventory = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        category: products.category,
        unit: products.unit,
        reorderLevel: products.reorderLevel,
        onHand: sql<number>`coalesce(
          sum(
            case
              when ${stockMovements.toLocationId} is not null and ${stockMovements.fromLocationId} is null then ${stockMovements.quantity}
              when ${stockMovements.fromLocationId} is not null and ${stockMovements.toLocationId} is null then -${stockMovements.quantity}
              else 0
            end
          ),
          0
        )::int`,
      })
      .from(products)
      .leftJoin(
        stockMovements,
        and(
          eq(stockMovements.productId, products.id),
          eq(stockMovements.status, "done"),
        ),
      )
      .groupBy(products.id)
      .orderBy(products.name);

    if (dbInventory && dbInventory.length > 0) {
      return dbInventory;
    }
  } catch (_e) {
    // fallback
  }

  const allMoves = [
    ...fallbackReceiptMovements,
    ...fallbackIssueMovements,
    ...fallbackTransferMovements,
    ...fallbackAdjustmentMovements,
  ];

  return fallbackProducts
    .map((prod) => {
      const moves = allMoves.filter(
        (m) => m.productId === prod.id && m.status === "done",
      );
      const onHand = moves.reduce((sum, m) => {
        if (m.toLocationId !== null && m.fromLocationId === null) return sum + m.quantity;
        if (m.fromLocationId !== null && m.toLocationId === null) return sum - m.quantity;
        return sum;
      }, 0);
      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        unit: prod.unit,
        reorderLevel: prod.reorderLevel,
        onHand: Math.max(0, onHand),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Receipt Queries
 */
export async function getNextReceiptReference(): Promise<string> {
  let count = fallbackReceiptMovements.length + 1;
  try {
    const rows = await db
      .select({ ref: stockMovements.reference })
      .from(stockMovements)
      .where(eq(stockMovements.kind, "receipt"));
    if (rows.length > 0) {
      count = rows.length + 1;
    }
  } catch (_e) {
    // use fallback count
  }
  const padded = String(count).padStart(4, "0");
  return `WH/IN/${padded}`;
}

export async function listReceipts(): Promise<ReceiptDetailRow[]> {
  try {
    const rows = await db
      .select({
        id: stockMovements.id,
        reference: stockMovements.reference,
        supplier: stockMovements.supplier,
        productId: stockMovements.productId,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit,
        quantity: stockMovements.quantity,
        status: stockMovements.status,
        fromLocationId: stockMovements.fromLocationId,
        toLocationId: stockMovements.toLocationId,
        note: stockMovements.note,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .where(eq(stockMovements.kind, "receipt"))
      .orderBy(desc(stockMovements.createdAt));

    if (rows.length > 0) {
      return rows.map((r) => ({
        ...r,
        reference: r.reference || "WH/IN/0000",
        supplier: r.supplier || "Supplier",
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
      }));
    }
  } catch (_e) {
    // fallback
  }

  return [...fallbackReceiptMovements]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((rm) => {
      const prod = fallbackProducts.find((p) => p.id === rm.productId);
      return {
        id: rm.id,
        reference: rm.reference,
        supplier: rm.supplier,
        productId: rm.productId,
        productName: prod?.name || "Unknown Product",
        productSku: prod?.sku || "SKU-0000",
        productUnit: prod?.unit || "pcs",
        quantity: rm.quantity,
        status: rm.status,
        fromLocationId: rm.fromLocationId,
        toLocationId: rm.toLocationId,
        note: rm.note || null,
        createdAt: rm.createdAt,
      };
    });
}

export async function insertReceipt(values: {
  productId: string;
  quantity: number;
  reference: string;
  supplier: string;
  toLocationId: string;
  fromLocationId: null;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note?: string;
}): Promise<ExtendedMovement> {
  try {
    const rows = await db
      .insert(stockMovements)
      .values({
        productId: values.productId,
        kind: "receipt",
        quantity: values.quantity,
        status: values.status,
        reference: values.reference,
        supplier: values.supplier,
        fromLocationId: null,
        toLocationId: values.toLocationId,
        note: values.note,
      })
      .returning();

    if (rows.length > 0) {
      const r = rows[0];
      const newMove: ExtendedMovement = {
        id: r.id,
        reference: r.reference || values.reference,
        supplier: r.supplier || values.supplier,
        productId: r.productId,
        kind: "receipt",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: null,
        toLocationId: r.toLocationId || values.toLocationId,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
      fallbackReceiptMovements.unshift(newMove);
      return newMove;
    }
  } catch (_e) {
    // fallback
  }

  const newMove: ExtendedMovement = {
    id: crypto.randomUUID(),
    reference: values.reference,
    supplier: values.supplier,
    productId: values.productId,
    kind: "receipt",
    quantity: values.quantity,
    status: values.status,
    fromLocationId: null,
    toLocationId: values.toLocationId,
    note: values.note,
    createdAt: new Date(),
  };

  fallbackReceiptMovements.unshift(newMove);
  return newMove;
}

export async function validateReceiptById(id: string): Promise<boolean> {
  try {
    const rows = await db
      .update(stockMovements)
      .set({ status: "done" })
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "receipt")))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackReceiptMovements.findIndex((m) => m.id === id);
      if (idx !== -1) {
        fallbackReceiptMovements[idx].status = "done";
      }
      return true;
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackReceiptMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackReceiptMovements[idx].status = "done";
    return true;
  }
  return false;
}

export async function cancelReceiptById(id: string): Promise<boolean> {
  try {
    const rows = await db
      .update(stockMovements)
      .set({ status: "canceled" })
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "receipt")))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackReceiptMovements.findIndex((m) => m.id === id);
      if (idx !== -1) {
        fallbackReceiptMovements[idx].status = "canceled";
      }
      return true;
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackReceiptMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackReceiptMovements[idx].status = "canceled";
    return true;
  }
  return false;
}

export async function updateReceiptById(
  id: string,
  values: {
    supplier: string;
    productId: string;
    toLocationId: string;
    quantity: number;
    note?: string;
    status?: "draft" | "waiting" | "ready" | "done" | "canceled";
  },
): Promise<ExtendedMovement | null> {
  const existing = fallbackReceiptMovements.find((m) => m.id === id);
  if (existing && existing.status !== "draft") {
    throw new Error("Cannot edit document: Only draft documents can be modified.");
  }

  try {
    const updateData: Record<string, any> = {
      supplier: values.supplier,
      productId: values.productId,
      toLocationId: values.toLocationId,
      quantity: values.quantity,
      note: values.note,
    };
    if (values.status) {
      updateData.status = values.status;
    }

    const rows = await db
      .update(stockMovements)
      .set(updateData)
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "receipt"), eq(stockMovements.status, "draft")))
      .returning();

    if (rows.length > 0) {
      const r = rows[0];
      const idx = fallbackReceiptMovements.findIndex((m) => m.id === id);
      const updatedMove: ExtendedMovement = {
        id: r.id,
        reference: r.reference || (existing ? existing.reference : "WH/IN/0000"),
        supplier: r.supplier || values.supplier,
        productId: r.productId,
        kind: "receipt",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: null,
        toLocationId: r.toLocationId || values.toLocationId,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
      if (idx !== -1) {
        fallbackReceiptMovements[idx] = updatedMove;
      }
      return updatedMove;
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Only draft documents")) throw err;
  }

  const idx = fallbackReceiptMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    if (fallbackReceiptMovements[idx].status !== "draft") {
      throw new Error("Cannot edit document: Only draft documents can be modified.");
    }
    fallbackReceiptMovements[idx] = {
      ...fallbackReceiptMovements[idx],
      supplier: values.supplier,
      productId: values.productId,
      toLocationId: values.toLocationId,
      quantity: values.quantity,
      note: values.note,
      status: values.status || fallbackReceiptMovements[idx].status,
    };
    return fallbackReceiptMovements[idx];
  }

  return null;
}

/**
 * Delivery Queries
 */
export async function getNextDeliveryReference(): Promise<string> {
  let count = fallbackIssueMovements.length + 1;
  try {
    const rows = await db
      .select({ ref: stockMovements.reference })
      .from(stockMovements)
      .where(eq(stockMovements.kind, "issue"));
    if (rows.length > 0) {
      count = rows.length + 1;
    }
  } catch (_e) {
    // fallback
  }
  const padded = String(count).padStart(4, "0");
  return `WH/OUT/${padded}`;
}

export async function listDeliveries(): Promise<DeliveryDetailRow[]> {
  try {
    const rows = await db
      .select({
        id: stockMovements.id,
        reference: stockMovements.reference,
        customer: stockMovements.supplier,
        productId: stockMovements.productId,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit,
        quantity: stockMovements.quantity,
        status: stockMovements.status,
        fromLocationId: stockMovements.fromLocationId,
        toLocationId: stockMovements.toLocationId,
        note: stockMovements.note,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .where(eq(stockMovements.kind, "issue"))
      .orderBy(desc(stockMovements.createdAt));

    if (rows.length > 0) {
      const result: DeliveryDetailRow[] = [];
      for (const r of rows) {
        const availableStock = await getProductStockAtLocation(r.productId, r.fromLocationId);
        result.push({
          ...r,
          reference: r.reference || "WH/OUT/0000",
          customer: r.customer || "Customer",
          availableStock,
          status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        });
      }
      return result;
    }
  } catch (_e) {
    // fallback
  }

  const result: DeliveryDetailRow[] = [];
  const sorted = [...fallbackIssueMovements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  for (const im of sorted) {
    const prod = fallbackProducts.find((p) => p.id === im.productId);
    const availableStock = await getProductStockAtLocation(im.productId, im.fromLocationId);
    result.push({
      id: im.id,
      reference: im.reference,
      customer: im.supplier || "Customer",
      productId: im.productId,
      productName: prod?.name || "Unknown Product",
      productSku: prod?.sku || "SKU-0000",
      productUnit: prod?.unit || "pcs",
      quantity: im.quantity,
      availableStock,
      status: im.status,
      fromLocationId: im.fromLocationId,
      toLocationId: im.toLocationId,
      note: im.note || null,
      createdAt: im.createdAt,
    });
  }

  return result;
}

export async function insertDelivery(values: {
  productId: string;
  quantity: number;
  reference: string;
  customer: string;
  fromLocationId: string;
  toLocationId: null;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note?: string;
}): Promise<ExtendedMovement> {
  // If attempting to insert directly as 'done', check available stock
  if (values.status === "done") {
    const available = await getProductStockAtLocation(values.productId, values.fromLocationId);
    if (values.quantity > available) {
      const locationName = values.fromLocationId || "WH/Stock";
      throw new Error(`Insufficient available stock at ${locationName}.`);
    }
  }

  try {
    const rows = await db
      .insert(stockMovements)
      .values({
        productId: values.productId,
        kind: "issue",
        quantity: values.quantity,
        status: values.status,
        reference: values.reference,
        supplier: values.customer,
        fromLocationId: values.fromLocationId,
        toLocationId: null,
        note: values.note,
      })
      .returning();

    if (rows.length > 0) {
      const r = rows[0];
      const newMove: ExtendedMovement = {
        id: r.id,
        reference: r.reference || values.reference,
        supplier: r.supplier || values.customer,
        productId: r.productId,
        kind: "issue",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId || values.fromLocationId,
        toLocationId: null,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
      fallbackIssueMovements.unshift(newMove);
      return newMove;
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Insufficient")) {
      throw error;
    }
    // fallback
  }

  const newMove: ExtendedMovement = {
    id: crypto.randomUUID(),
    reference: values.reference,
    supplier: values.customer,
    productId: values.productId,
    kind: "issue",
    quantity: values.quantity,
    status: values.status,
    fromLocationId: values.fromLocationId,
    toLocationId: null,
    note: values.note,
    createdAt: new Date(),
  };

  fallbackIssueMovements.unshift(newMove);
  return newMove;
}

export async function validateDeliveryById(
  id: string,
): Promise<{ success: boolean; message: string }> {
  // Find movement first
  let move: ExtendedMovement | undefined;

  try {
    const rows = await db
      .select()
      .from(stockMovements)
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "issue")));

    if (rows.length > 0) {
      const r = rows[0];
      move = {
        id: r.id,
        reference: r.reference || "WH/OUT/0000",
        supplier: r.supplier || "Customer",
        productId: r.productId,
        kind: "issue",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId,
        toLocationId: null,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
    }
  } catch (_e) {
    // fallback
  }

  if (!move) {
    move = fallbackIssueMovements.find((m) => m.id === id);
  }

  if (!move) {
    return { success: false, message: "Delivery order not found." };
  }

  const locationName = move.fromLocationId || "WH/Stock";
  const available = await getProductStockAtLocation(move.productId, move.fromLocationId);

  // Exact stock check requirement
  if (move.quantity > available) {
    return {
      success: false,
      message: `Insufficient available stock at ${locationName}.`,
    };
  }

  try {
    const rows = await db
      .update(stockMovements)
      .set({ status: "done" })
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "issue")))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackIssueMovements.findIndex((m) => m.id === id);
      if (idx !== -1) {
        fallbackIssueMovements[idx].status = "done";
      }
      return { success: true, message: `Delivery ${move.reference} validated! Derived stock updated.` };
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackIssueMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackIssueMovements[idx].status = "done";
    return { success: true, message: `Delivery ${move.reference} validated! Derived stock updated.` };
  }

  return { success: false, message: `Failed to validate delivery ${move.reference}.` };
}

export async function cancelDeliveryById(id: string): Promise<boolean> {
  try {
    const rows = await db
      .update(stockMovements)
      .set({ status: "canceled" })
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "issue")))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackIssueMovements.findIndex((m) => m.id === id);
      if (idx !== -1) {
        fallbackIssueMovements[idx].status = "canceled";
      }
      return true;
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackIssueMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackIssueMovements[idx].status = "canceled";
    return true;
  }
  return false;
}

export async function updateDeliveryById(
  id: string,
  values: {
    customer: string;
    productId: string;
    fromLocationId: string;
    quantity: number;
    note?: string;
    status?: "draft" | "waiting" | "ready" | "done" | "canceled";
  },
): Promise<ExtendedMovement | null> {
  const existing = fallbackIssueMovements.find((m) => m.id === id);
  if (existing && existing.status !== "draft") {
    throw new Error("Cannot edit document: Only draft documents can be modified.");
  }

  if (values.status === "done") {
    const available = await getProductStockAtLocation(values.productId, values.fromLocationId);
    if (values.quantity > available) {
      throw new Error(`Insufficient available stock at ${values.fromLocationId}.`);
    }
  }

  try {
    const updateData: Record<string, any> = {
      supplier: values.customer,
      productId: values.productId,
      fromLocationId: values.fromLocationId,
      quantity: values.quantity,
      note: values.note,
    };
    if (values.status) {
      updateData.status = values.status;
    }

    const rows = await db
      .update(stockMovements)
      .set(updateData)
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "issue"), eq(stockMovements.status, "draft")))
      .returning();

    if (rows.length > 0) {
      const r = rows[0];
      const idx = fallbackIssueMovements.findIndex((m) => m.id === id);
      const updatedMove: ExtendedMovement = {
        id: r.id,
        reference: r.reference || (existing ? existing.reference : "WH/OUT/0000"),
        supplier: r.supplier || values.customer,
        productId: r.productId,
        kind: "issue",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId,
        toLocationId: null,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
      if (idx !== -1) {
        fallbackIssueMovements[idx] = updatedMove;
      }
      return updatedMove;
    }
  } catch (err) {
    if (err instanceof Error) throw err;
  }

  const idx = fallbackIssueMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    if (fallbackIssueMovements[idx].status !== "draft") {
      throw new Error("Cannot edit document: Only draft documents can be modified.");
    }
    fallbackIssueMovements[idx] = {
      ...fallbackIssueMovements[idx],
      supplier: values.customer,
      productId: values.productId,
      fromLocationId: values.fromLocationId,
      quantity: values.quantity,
      note: values.note,
      status: values.status || fallbackIssueMovements[idx].status,
    };
    return fallbackIssueMovements[idx];
  }

  return null;
}

/**
 * Internal Transfer Queries
 */
export async function getNextTransferReference(): Promise<string> {
  let count = fallbackTransferMovements.length + 1;
  try {
    const rows = await db
      .select({ ref: stockMovements.reference })
      .from(stockMovements)
      .where(eq(stockMovements.kind, "transfer"));
    if (rows.length > 0) {
      count = rows.length + 1;
    }
  } catch (_e) {
    // fallback
  }
  const padded = String(count).padStart(4, "0");
  return `WH/TR/${padded}`;
}

export async function listTransfers(): Promise<TransferDetailRow[]> {
  try {
    const rows = await db
      .select({
        id: stockMovements.id,
        reference: stockMovements.reference,
        productId: stockMovements.productId,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit,
        quantity: stockMovements.quantity,
        status: stockMovements.status,
        fromLocationId: stockMovements.fromLocationId,
        toLocationId: stockMovements.toLocationId,
        note: stockMovements.note,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .where(eq(stockMovements.kind, "transfer"))
      .orderBy(desc(stockMovements.createdAt));

    if (rows.length > 0) {
      const result: TransferDetailRow[] = [];
      for (const r of rows) {
        const availableStock = await getProductStockAtLocation(
          r.productId,
          r.fromLocationId,
        );
        result.push({
          ...r,
          reference: r.reference || "WH/TR/0000",
          availableStock,
          fromLocationId: r.fromLocationId || "Main Warehouse",
          toLocationId: r.toLocationId || "Production Floor",
          status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        });
      }
      return result;
    }
  } catch (_e) {
    // fallback
  }

  const result: TransferDetailRow[] = [];
  const sorted = [...fallbackTransferMovements].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  for (const tm of sorted) {
    const prod = fallbackProducts.find((p) => p.id === tm.productId);
    const availableStock = await getProductStockAtLocation(
      tm.productId,
      tm.fromLocationId,
    );
    result.push({
      id: tm.id,
      reference: tm.reference,
      productId: tm.productId,
      productName: prod?.name || "Unknown Product",
      productSku: prod?.sku || "SKU-0000",
      productUnit: prod?.unit || "pcs",
      quantity: tm.quantity,
      availableStock,
      status: tm.status,
      fromLocationId: tm.fromLocationId || "Main Warehouse",
      toLocationId: tm.toLocationId || "Production Floor",
      note: tm.note || null,
      createdAt: tm.createdAt,
    });
  }

  return result;
}

export async function insertTransfer(values: {
  productId: string;
  quantity: number;
  reference: string;
  fromLocationId: string;
  toLocationId: string;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  note?: string;
}): Promise<ExtendedMovement> {
  if (
    values.fromLocationId.trim().toLowerCase() ===
    values.toLocationId.trim().toLowerCase()
  ) {
    throw new Error("Source and destination locations cannot be the same.");
  }

  if (values.status === "done") {
    const available = await getProductStockAtLocation(
      values.productId,
      values.fromLocationId,
    );
    if (values.quantity > available) {
      throw new Error(
        `Insufficient available stock at ${values.fromLocationId}. Requested: ${values.quantity}, Available: ${available}`,
      );
    }
  }

  try {
    const rows = await db
      .insert(stockMovements)
      .values({
        productId: values.productId,
        kind: "transfer",
        quantity: values.quantity,
        status: values.status,
        reference: values.reference,
        supplier: "Internal Transfer",
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        note: values.note,
      })
      .returning();

    if (rows.length > 0) {
      const r = rows[0];
      const newMove: ExtendedMovement = {
        id: r.id,
        reference: r.reference || values.reference,
        supplier: "Internal Transfer",
        productId: r.productId,
        kind: "transfer",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId || values.fromLocationId,
        toLocationId: r.toLocationId || values.toLocationId,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
      fallbackTransferMovements.unshift(newMove);
      return newMove;
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Insufficient") ||
        error.message.includes("cannot be the same"))
    ) {
      throw error;
    }
    // fallback
  }

  const newMove: ExtendedMovement = {
    id: crypto.randomUUID(),
    reference: values.reference,
    supplier: "Internal Transfer",
    productId: values.productId,
    kind: "transfer",
    quantity: values.quantity,
    status: values.status,
    fromLocationId: values.fromLocationId,
    toLocationId: values.toLocationId,
    note: values.note,
    createdAt: new Date(),
  };

  fallbackTransferMovements.unshift(newMove);
  return newMove;
}

export async function validateTransferById(
  id: string,
): Promise<{ success: boolean; message: string }> {
  let move: ExtendedMovement | undefined;

  try {
    const rows = await db
      .select()
      .from(stockMovements)
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "transfer")));

    if (rows.length > 0) {
      const r = rows[0];
      move = {
        id: r.id,
        reference: r.reference || "WH/TR/0000",
        supplier: r.supplier || "Internal Transfer",
        productId: r.productId,
        kind: "transfer",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId,
        toLocationId: r.toLocationId,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
    }
  } catch (_e) {
    // fallback
  }

  if (!move) {
    move = fallbackTransferMovements.find((m) => m.id === id);
  }

  if (!move) {
    return { success: false, message: "Internal transfer order not found." };
  }

  const sourceLoc = move.fromLocationId || "Main Warehouse";
  const destLoc = move.toLocationId || "Production Floor";

  if (sourceLoc.trim().toLowerCase() === destLoc.trim().toLowerCase()) {
    return {
      success: false,
      message: "Source and destination locations cannot be the same.",
    };
  }

  const available = await getProductStockAtLocation(move.productId, sourceLoc);

  if (move.quantity > available) {
    return {
      success: false,
      message: `Insufficient available stock at ${sourceLoc}.`,
    };
  }

  try {
    const rows = await db
      .update(stockMovements)
      .set({ status: "done" })
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "transfer")))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackTransferMovements.findIndex((m) => m.id === id);
      if (idx !== -1) {
        fallbackTransferMovements[idx].status = "done";
      }
      return {
        success: true,
        message: `Transferred ${move.quantity} units from ${sourceLoc} to ${destLoc}.`,
      };
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackTransferMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackTransferMovements[idx].status = "done";
    return {
      success: true,
      message: `Transferred ${move.quantity} units from ${sourceLoc} to ${destLoc}.`,
    };
  }

  return {
    success: false,
    message: `Failed to validate transfer ${move.reference}.`,
  };
}

export async function cancelTransferById(id: string): Promise<boolean> {
  try {
    const rows = await db
      .update(stockMovements)
      .set({ status: "canceled" })
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "transfer")))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackTransferMovements.findIndex((m) => m.id === id);
      if (idx !== -1) {
        fallbackTransferMovements[idx].status = "canceled";
      }
      return true;
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackTransferMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackTransferMovements[idx].status = "canceled";
    return true;
  }
  return false;
}

export async function updateTransferById(
  id: string,
  values: {
    productId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    note?: string;
    status?: "draft" | "waiting" | "ready" | "done" | "canceled";
  },
): Promise<ExtendedMovement | null> {
  const existing = fallbackTransferMovements.find((m) => m.id === id);
  if (existing && existing.status !== "draft") {
    throw new Error("Cannot edit document: Only draft documents can be modified.");
  }

  if (values.fromLocationId.trim().toLowerCase() === values.toLocationId.trim().toLowerCase()) {
    throw new Error("Source and destination locations cannot be the same.");
  }

  if (values.status === "done") {
    const available = await getProductStockAtLocation(values.productId, values.fromLocationId);
    if (values.quantity > available) {
      throw new Error(`Insufficient available stock at ${values.fromLocationId}.`);
    }
  }

  try {
    const updateData: Record<string, any> = {
      productId: values.productId,
      fromLocationId: values.fromLocationId,
      toLocationId: values.toLocationId,
      quantity: values.quantity,
      note: values.note,
    };
    if (values.status) {
      updateData.status = values.status;
    }

    const rows = await db
      .update(stockMovements)
      .set(updateData)
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "transfer"), eq(stockMovements.status, "draft")))
      .returning();

    if (rows.length > 0) {
      const r = rows[0];
      const idx = fallbackTransferMovements.findIndex((m) => m.id === id);
      const updatedMove: ExtendedMovement = {
        id: r.id,
        reference: r.reference || (existing ? existing.reference : "WH/TR/0000"),
        supplier: r.supplier || "Internal Transfer",
        productId: r.productId,
        kind: "transfer",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId,
        toLocationId: r.toLocationId,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
      if (idx !== -1) {
        fallbackTransferMovements[idx] = updatedMove;
      }
      return updatedMove;
    }
  } catch (err) {
    if (err instanceof Error) throw err;
  }

  const idx = fallbackTransferMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    if (fallbackTransferMovements[idx].status !== "draft") {
      throw new Error("Cannot edit document: Only draft documents can be modified.");
    }
    fallbackTransferMovements[idx] = {
      ...fallbackTransferMovements[idx],
      productId: values.productId,
      fromLocationId: values.fromLocationId,
      toLocationId: values.toLocationId,
      quantity: values.quantity,
      note: values.note,
      status: values.status || fallbackTransferMovements[idx].status,
    };
    return fallbackTransferMovements[idx];
  }

  return null;
}

/**
 * Stock Adjustment Queries
 */
export async function getNextAdjustmentReference(): Promise<string> {
  let count = fallbackAdjustmentMovements.length + 1;
  try {
    const rows = await db
      .select({ ref: stockMovements.reference })
      .from(stockMovements)
      .where(eq(stockMovements.kind, "adjustment"));
    if (rows.length > 0) {
      count = rows.length + 1;
    }
  } catch (_e) {
    // fallback
  }
  const padded = String(count).padStart(4, "0");
  return `WH/ADJ/${padded}`;
}

export async function listAdjustments(): Promise<AdjustmentDetailRow[]> {
  try {
    const rows = await db
      .select({
        id: stockMovements.id,
        reference: stockMovements.reference,
        productId: stockMovements.productId,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit,
        quantity: stockMovements.quantity,
        status: stockMovements.status,
        fromLocationId: stockMovements.fromLocationId,
        toLocationId: stockMovements.toLocationId,
        note: stockMovements.note,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .where(eq(stockMovements.kind, "adjustment"))
      .orderBy(desc(stockMovements.createdAt));

    if (rows.length > 0) {
      const result: AdjustmentDetailRow[] = [];
      for (const r of rows) {
        const locationId = r.fromLocationId || r.toLocationId || "WH/Stock";
        const currentLocStock = await getProductStockAtLocation(r.productId, locationId);
        const delta = r.toLocationId ? r.quantity : -r.quantity;

        let recordedStock: number;
        if (r.status === "done") {
          recordedStock = currentLocStock - delta;
        } else {
          recordedStock = currentLocStock;
        }
        const physicalCount = recordedStock + delta;

        result.push({
          id: r.id,
          reference: r.reference || "WH/ADJ/0000",
          productId: r.productId,
          productName: r.productName,
          productSku: r.productSku,
          productUnit: r.productUnit,
          locationId,
          recordedStock,
          physicalCount,
          delta,
          status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
          note: r.note || null,
          createdAt: r.createdAt,
        });
      }
      return result;
    }
  } catch (_e) {
    // fallback
  }

  const result: AdjustmentDetailRow[] = [];
  const sorted = [...fallbackAdjustmentMovements].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  for (const am of sorted) {
    const prod = fallbackProducts.find((p) => p.id === am.productId);
    const locationId = am.fromLocationId || am.toLocationId || "WH/Stock";
    const currentLocStock = await getProductStockAtLocation(am.productId, locationId);
    const delta = am.toLocationId ? am.quantity : -am.quantity;

    let recordedStock: number;
    if (am.status === "done") {
      recordedStock = currentLocStock - delta;
    } else {
      recordedStock = currentLocStock;
    }
    const physicalCount = recordedStock + delta;

    result.push({
      id: am.id,
      reference: am.reference,
      productId: am.productId,
      productName: prod?.name || "Unknown Product",
      productSku: prod?.sku || "SKU-0000",
      productUnit: prod?.unit || "pcs",
      locationId,
      recordedStock,
      physicalCount,
      delta,
      status: am.status,
      note: am.note || null,
      createdAt: am.createdAt,
    });
  }

  return result;
}

export async function insertAdjustment(values: {
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
}): Promise<ExtendedMovement> {
  if (values.delta === 0 || values.quantity === 0) {
    throw new Error("Physical count already matches recorded stock.");
  }

  try {
    const rows = await db
      .insert(stockMovements)
      .values({
        productId: values.productId,
        kind: "adjustment",
        quantity: values.quantity,
        status: values.status,
        reference: values.reference,
        supplier: "Stock Audit",
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        note: values.note,
      })
      .returning();

    if (rows.length > 0) {
      const r = rows[0];
      const newMove: ExtendedMovement = {
        id: r.id,
        reference: r.reference || values.reference,
        supplier: "Stock Audit",
        productId: r.productId,
        kind: "adjustment",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId,
        toLocationId: r.toLocationId,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
      fallbackAdjustmentMovements.unshift(newMove);
      return newMove;
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already matches recorded stock")
    ) {
      throw error;
    }
    // fallback
  }

  const newMove: ExtendedMovement = {
    id: crypto.randomUUID(),
    reference: values.reference,
    supplier: "Stock Audit",
    productId: values.productId,
    kind: "adjustment",
    quantity: values.quantity,
    status: values.status,
    fromLocationId: values.fromLocationId,
    toLocationId: values.toLocationId,
    note: values.note,
    createdAt: new Date(),
  };

  fallbackAdjustmentMovements.unshift(newMove);
  return newMove;
}

export async function validateAdjustmentById(
  id: string,
): Promise<{ success: boolean; message: string }> {
  let move: ExtendedMovement | undefined;

  try {
    const rows = await db
      .select()
      .from(stockMovements)
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "adjustment")));

    if (rows.length > 0) {
      const r = rows[0];
      move = {
        id: r.id,
        reference: r.reference || "WH/ADJ/0000",
        supplier: r.supplier || "Stock Audit",
        productId: r.productId,
        kind: "adjustment",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId,
        toLocationId: r.toLocationId,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
    }
  } catch (_e) {
    // fallback
  }

  if (!move) {
    move = fallbackAdjustmentMovements.find((m) => m.id === id);
  }

  if (!move) {
    return { success: false, message: "Adjustment record not found." };
  }

  if (move.status === "done") {
    return { success: true, message: `Adjustment ${move.reference} is already posted.` };
  }

  try {
    const rows = await db
      .update(stockMovements)
      .set({ status: "done" })
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "adjustment")))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackAdjustmentMovements.findIndex((m) => m.id === id);
      if (idx !== -1) {
        fallbackAdjustmentMovements[idx].status = "done";
      }
      return {
        success: true,
        message: `Posted adjustment ${move.reference}! Derived stock updated.`,
      };
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackAdjustmentMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackAdjustmentMovements[idx].status = "done";
    return {
      success: true,
      message: `Posted adjustment ${move.reference}! Derived stock updated.`,
    };
  }

  return {
    success: false,
    message: `Failed to post adjustment ${move.reference}.`,
  };
}

export async function cancelAdjustmentById(id: string): Promise<boolean> {
  try {
    const rows = await db
      .update(stockMovements)
      .set({ status: "canceled" })
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "adjustment")))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackAdjustmentMovements.findIndex((m) => m.id === id);
      if (idx !== -1) {
        fallbackAdjustmentMovements[idx].status = "canceled";
      }
      return true;
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackAdjustmentMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackAdjustmentMovements[idx].status = "canceled";
    return true;
  }
  return false;
}

export async function updateAdjustmentById(
  id: string,
  values: {
    productId: string;
    locationId: string;
    physicalCount: number;
    recordedStock: number;
    delta: number;
    quantity: number;
    fromLocationId: string | null;
    toLocationId: string | null;
    note?: string;
    status?: "draft" | "waiting" | "ready" | "done" | "canceled";
  },
): Promise<ExtendedMovement | null> {
  const existing = fallbackAdjustmentMovements.find((m) => m.id === id);
  if (existing && existing.status !== "draft") {
    throw new Error("Cannot edit document: Only draft documents can be modified.");
  }

  if (values.delta === 0 || values.quantity === 0) {
    throw new Error("Physical count already matches recorded stock.");
  }

  try {
    const updateData: Record<string, any> = {
      productId: values.productId,
      fromLocationId: values.fromLocationId,
      toLocationId: values.toLocationId,
      quantity: values.quantity,
      note: values.note,
    };
    if (values.status) {
      updateData.status = values.status;
    }

    const rows = await db
      .update(stockMovements)
      .set(updateData)
      .where(and(eq(stockMovements.id, id), eq(stockMovements.kind, "adjustment"), eq(stockMovements.status, "draft")))
      .returning();

    if (rows.length > 0) {
      const r = rows[0];
      const idx = fallbackAdjustmentMovements.findIndex((m) => m.id === id);
      const updatedMove: ExtendedMovement = {
        id: r.id,
        reference: r.reference || (existing ? existing.reference : "WH/ADJ/0000"),
        supplier: "Stock Audit",
        productId: r.productId,
        kind: "adjustment",
        quantity: r.quantity,
        status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
        fromLocationId: r.fromLocationId,
        toLocationId: r.toLocationId,
        note: r.note || undefined,
        createdAt: r.createdAt,
      };
      if (idx !== -1) {
        fallbackAdjustmentMovements[idx] = updatedMove;
      }
      return updatedMove;
    }
  } catch (err) {
    if (err instanceof Error) throw err;
  }

  const idx = fallbackAdjustmentMovements.findIndex((m) => m.id === id);
  if (idx !== -1) {
    if (fallbackAdjustmentMovements[idx].status !== "draft") {
      throw new Error("Cannot edit document: Only draft documents can be modified.");
    }
    fallbackAdjustmentMovements[idx] = {
      ...fallbackAdjustmentMovements[idx],
      productId: values.productId,
      fromLocationId: values.fromLocationId,
      toLocationId: values.toLocationId,
      quantity: values.quantity,
      note: values.note,
      status: values.status || fallbackAdjustmentMovements[idx].status,
    };
    return fallbackAdjustmentMovements[idx];
  }

  return null;
}

/**
 * Move History / Stock Ledger Queries
 * Returns unified movements across Receipts, Deliveries, Transfers, and Adjustments, newest first.
 */
export async function listMoveHistory(): Promise<MoveHistoryRow[]> {
  try {
    const rows = await db
      .select({
        id: stockMovements.id,
        reference: stockMovements.reference,
        kind: stockMovements.kind,
        supplier: stockMovements.supplier,
        productId: stockMovements.productId,
        productName: products.name,
        productSku: products.sku,
        productCategory: products.category,
        productUnit: products.unit,
        quantity: stockMovements.quantity,
        status: stockMovements.status,
        fromLocationId: stockMovements.fromLocationId,
        toLocationId: stockMovements.toLocationId,
        note: stockMovements.note,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .orderBy(desc(stockMovements.createdAt));

    if (rows.length > 0) {
      return rows.map((r) => {
        const kind = r.kind as "receipt" | "issue" | "transfer" | "adjustment";
        let typeLabel: "Receipt" | "Delivery" | "Transfer" | "Adjustment";
        let signedQuantity = r.quantity;

        if (kind === "receipt") {
          typeLabel = "Receipt";
          signedQuantity = r.quantity;
        } else if (kind === "issue") {
          typeLabel = "Delivery";
          signedQuantity = -r.quantity;
        } else if (kind === "transfer") {
          typeLabel = "Transfer";
          signedQuantity = r.quantity;
        } else {
          typeLabel = "Adjustment";
          if (r.toLocationId !== null && r.fromLocationId === null) {
            signedQuantity = r.quantity;
          } else if (r.fromLocationId !== null && r.toLocationId === null) {
            signedQuantity = -r.quantity;
          } else {
            signedQuantity = r.quantity;
          }
        }

        return {
          id: r.id,
          reference: r.reference || "WH/MOV/0000",
          kind,
          typeLabel,
          productId: r.productId,
          productName: r.productName,
          productSku: r.productSku,
          productCategory: r.productCategory || "General",
          productUnit: r.productUnit,
          supplierOrCustomer: r.supplier || null,
          fromLocationId: r.fromLocationId || null,
          toLocationId: r.toLocationId || null,
          quantity: r.quantity,
          signedQuantity,
          status: r.status as "draft" | "waiting" | "ready" | "done" | "canceled",
          note: r.note || null,
          createdAt: r.createdAt,
        };
      });
    }
  } catch (_e) {
    // fallback
  }

  const allMoves = [
    ...fallbackReceiptMovements,
    ...fallbackIssueMovements,
    ...fallbackTransferMovements,
    ...fallbackAdjustmentMovements,
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return allMoves.map((m) => {
    const prod = fallbackProducts.find((p) => p.id === m.productId);
    const kind = m.kind;
    let typeLabel: "Receipt" | "Delivery" | "Transfer" | "Adjustment";
    let signedQuantity = m.quantity;

    if (kind === "receipt") {
      typeLabel = "Receipt";
      signedQuantity = m.quantity;
    } else if (kind === "issue") {
      typeLabel = "Delivery";
      signedQuantity = -m.quantity;
    } else if (kind === "transfer") {
      typeLabel = "Transfer";
      signedQuantity = m.quantity;
    } else {
      typeLabel = "Adjustment";
      if (m.toLocationId !== null && m.fromLocationId === null) {
        signedQuantity = m.quantity;
      } else if (m.fromLocationId !== null && m.toLocationId === null) {
        signedQuantity = -m.quantity;
      } else {
        signedQuantity = m.quantity;
      }
    }

    return {
      id: m.id,
      reference: m.reference,
      kind,
      typeLabel,
      productId: m.productId,
      productName: prod?.name || "Unknown Product",
      productSku: prod?.sku || "SKU-0000",
      productCategory: prod?.category || "General",
      productUnit: prod?.unit || "pcs",
      supplierOrCustomer: m.supplier || null,
      fromLocationId: m.fromLocationId || null,
      toLocationId: m.toLocationId || null,
      quantity: m.quantity,
      signedQuantity,
      status: m.status,
      note: m.note || null,
      createdAt: m.createdAt,
    };
  });
}

/**
 * Warehouse / Location Settings Queries
 */
export type WarehouseRow = {
  id: string;
  code: string;
  name: string;
  address?: string;
  isActive: boolean;
  locations: string[];
};

const fallbackWarehouses: WarehouseRow[] = [
  {
    id: "w1",
    code: "WH",
    name: "Main Warehouse",
    address: "Building A, Central Logistics Park",
    isActive: true,
    locations: ["WH/Stock", "Production Floor", "Packaging Zone"],
  },
  {
    id: "w2",
    code: "SF",
    name: "San Francisco Hub",
    address: "Bayview Dist. Terminal 4",
    isActive: true,
    locations: ["SF/Stock", "SF/Receiving"],
  },
];

export async function listWarehouses(): Promise<WarehouseRow[]> {
  try {
    const rows = await db.select().from(warehouses).orderBy(warehouses.code);
    if (rows.length > 0) {
      return rows.map((w) => ({
        id: w.id,
        code: w.code,
        name: w.name,
        address: w.address || undefined,
        isActive: w.isActive,
        locations: w.code === "WH" ? ["WH/Stock", "Production Floor", "Packaging Zone"] : [`${w.code}/Stock`, `${w.code}/Receiving`],
      }));
    }
  } catch (_e) {
    // fallback
  }

  return [...fallbackWarehouses];
}

export async function insertWarehouse(values: {
  code: string;
  name: string;
  address?: string;
}): Promise<WarehouseRow> {
  const codeFormatted = values.code.trim().toUpperCase();
  const exists = fallbackWarehouses.some((w) => w.code.toUpperCase() === codeFormatted);
  if (exists) {
    throw new Error(`A warehouse with code "${codeFormatted}" already exists.`);
  }

  try {
    const rows = await db
      .insert(warehouses)
      .values({
        code: codeFormatted,
        name: values.name.trim(),
        address: values.address ? values.address.trim() : null,
        isActive: true,
      })
      .returning();

    if (rows.length > 0) {
      const w = rows[0];
      const newWh: WarehouseRow = {
        id: w.id,
        code: w.code,
        name: w.name,
        address: w.address || undefined,
        isActive: w.isActive,
        locations: [`${w.code}/Stock`, `${w.code}/Receiving`],
      };
      fallbackWarehouses.push(newWh);
      return newWh;
    }
  } catch (_e) {
    // fallback
  }

  const newWh: WarehouseRow = {
    id: crypto.randomUUID(),
    code: codeFormatted,
    name: values.name.trim(),
    address: values.address ? values.address.trim() : undefined,
    isActive: true,
    locations: [`${codeFormatted}/Stock`, `${codeFormatted}/Receiving`],
  };
  fallbackWarehouses.push(newWh);
  return newWh;
}

export async function updateWarehouseById(
  id: string,
  values: {
    code: string;
    name: string;
    address?: string;
    isActive?: boolean;
  },
): Promise<WarehouseRow | null> {
  const codeFormatted = values.code.trim().toUpperCase();

  try {
    const rows = await db
      .update(warehouses)
      .set({
        code: codeFormatted,
        name: values.name.trim(),
        address: values.address ? values.address.trim() : null,
        isActive: values.isActive ?? true,
      })
      .where(eq(warehouses.id, id))
      .returning();

    if (rows.length > 0) {
      const w = rows[0];
      const idx = fallbackWarehouses.findIndex((wh) => wh.id === id);
      const updated: WarehouseRow = {
        id: w.id,
        code: w.code,
        name: w.name,
        address: w.address || undefined,
        isActive: w.isActive,
        locations: w.code === "WH" ? ["WH/Stock", "Production Floor", "Packaging Zone"] : [`${w.code}/Stock`, `${w.code}/Receiving`],
      };
      if (idx !== -1) fallbackWarehouses[idx] = updated;
      return updated;
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackWarehouses.findIndex((wh) => wh.id === id);
  if (idx !== -1) {
    fallbackWarehouses[idx] = {
      ...fallbackWarehouses[idx],
      code: codeFormatted,
      name: values.name.trim(),
      address: values.address ? values.address.trim() : undefined,
      isActive: values.isActive ?? fallbackWarehouses[idx].isActive,
      locations: codeFormatted === "WH" ? ["WH/Stock", "Production Floor", "Packaging Zone"] : [`${codeFormatted}/Stock`, `${codeFormatted}/Receiving`],
    };
    return fallbackWarehouses[idx];
  }

  return null;
}

export async function toggleWarehouseStatusById(id: string): Promise<WarehouseRow | null> {
  const wh = fallbackWarehouses.find((w) => w.id === id);
  const newStatus = wh ? !wh.isActive : false;

  try {
    const rows = await db
      .update(warehouses)
      .set({ isActive: newStatus })
      .where(eq(warehouses.id, id))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackWarehouses.findIndex((w) => w.id === id);
      if (idx !== -1) fallbackWarehouses[idx].isActive = newStatus;
      return {
        id: rows[0].id,
        code: rows[0].code,
        name: rows[0].name,
        address: rows[0].address || undefined,
        isActive: rows[0].isActive,
        locations: rows[0].code === "WH" ? ["WH/Stock", "Production Floor", "Packaging Zone"] : [`${rows[0].code}/Stock`, `${rows[0].code}/Receiving`],
      };
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackWarehouses.findIndex((w) => w.id === id);
  if (idx !== -1) {
    fallbackWarehouses[idx].isActive = !fallbackWarehouses[idx].isActive;
    return fallbackWarehouses[idx];
  }

  return null;
}

/**
 * User / Authentication Queries
 */
export type UserRow = {
  id: string;
  loginId: string;
  email: string;
  passwordHash: string;
  role: "inventory_manager" | "warehouse_staff";
  createdAt: Date;
  updatedAt: Date;
};

const globalForStore = globalThis as unknown as {
  fallbackUsers?: UserRow[];
  fallbackOtpCodes?: OtpRecord[];
};

if (!globalForStore.fallbackUsers) {
  globalForStore.fallbackUsers = [
    {
      id: "u1",
      loginId: "demo_user",
      email: "demo@stocksense.app",
      passwordHash: bcrypt.hashSync("Demo@123", 10),
      role: "inventory_manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "u2",
      loginId: "staff_user",
      email: "staff@stocksense.app",
      passwordHash: bcrypt.hashSync("Demo@123", 10),
      role: "warehouse_staff",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

const fallbackUsers = globalForStore.fallbackUsers;

export async function getUserByLoginId(loginId: string): Promise<UserRow | null> {
  const target = loginId.trim().toLowerCase();
  try {
    const rows = await db
      .select()
      .from(users)
      .where(sql`lower(${users.loginId}) = ${target}`)
      .limit(1);

    if (rows.length > 0) {
      return {
        ...rows[0],
        role: (rows[0].role as "inventory_manager" | "warehouse_staff") || "inventory_manager",
      };
    }
  } catch (_e) {
    // fallback
  }

  return fallbackUsers.find((u) => u.loginId.toLowerCase() === target) ?? null;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const target = email.trim().toLowerCase();
  try {
    const rows = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${target}`)
      .limit(1);

    if (rows.length > 0) {
      return {
        ...rows[0],
        role: (rows[0].role as "inventory_manager" | "warehouse_staff") || "inventory_manager",
      };
    }
  } catch (_e) {
    // fallback
  }

  return fallbackUsers.find((u) => u.email.toLowerCase() === target) ?? null;
}

export async function getUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const target = identifier.trim().toLowerCase();
  try {
    const rows = await db
      .select()
      .from(users)
      .where(
        or(
          sql`lower(${users.loginId}) = ${target}`,
          sql`lower(${users.email}) = ${target}`,
        ),
      )
      .limit(1);

    if (rows.length > 0) {
      return {
        ...rows[0],
        role: (rows[0].role as "inventory_manager" | "warehouse_staff") || "inventory_manager",
      };
    }
  } catch (_e) {
    // fallback
  }

  return (
    fallbackUsers.find(
      (u) =>
        u.loginId.toLowerCase() === target || u.email.toLowerCase() === target,
    ) ?? null
  );
}

export async function getUserById(id: string): Promise<UserRow | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (rows.length > 0) {
      return {
        ...rows[0],
        role: (rows[0].role as "inventory_manager" | "warehouse_staff") || "inventory_manager",
      };
    }
  } catch (_e) {
    // fallback
  }

  return fallbackUsers.find((u) => u.id === id) ?? null;
}

export async function insertUser(values: {
  loginId: string;
  email: string;
  passwordHash: string;
  role?: "inventory_manager" | "warehouse_staff";
}): Promise<UserRow> {
  const loginIdClean = values.loginId.trim();
  const emailClean = values.email.trim().toLowerCase();
  const role = values.role || "inventory_manager";

  try {
    const rows = await db
      .insert(users)
      .values({
        loginId: loginIdClean,
        email: emailClean,
        passwordHash: values.passwordHash,
        role,
      })
      .returning();

    if (rows.length > 0) {
      const u = rows[0];
      const newU: UserRow = {
        id: u.id,
        loginId: u.loginId,
        email: u.email,
        passwordHash: u.passwordHash,
        role: (u.role as "inventory_manager" | "warehouse_staff") || role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
      fallbackUsers.push(newU);
      return newU;
    }
  } catch (_e) {
    // fallback
  }

  const newU: UserRow = {
    id: crypto.randomUUID(),
    loginId: loginIdClean,
    email: emailClean,
    passwordHash: values.passwordHash,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  fallbackUsers.push(newU);
  return newU;
}

export async function updateUserRole(
  userId: string,
  role: "inventory_manager" | "warehouse_staff",
): Promise<UserRow | null> {
  try {
    const rows = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (rows.length > 0) {
      const idx = fallbackUsers.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        fallbackUsers[idx].role = role;
      }
      return {
        ...rows[0],
        role: rows[0].role as "inventory_manager" | "warehouse_staff",
      };
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackUsers.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    fallbackUsers[idx].role = role;
    return fallbackUsers[idx];
  }

  return null;
}

export async function updateUserPasswordByEmail(
  email: string,
  newPasswordHash: string,
): Promise<boolean> {
  const target = email.trim().toLowerCase();
  try {
    const rows = await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(sql`lower(${users.email}) = ${target}`)
      .returning();

    if (rows.length > 0) {
      const idx = fallbackUsers.findIndex((u) => u.email.toLowerCase() === target);
      if (idx !== -1) {
        fallbackUsers[idx].passwordHash = newPasswordHash;
        fallbackUsers[idx].updatedAt = new Date();
      }
      return true;
    }
  } catch (_e) {
    // fallback
  }

  const idx = fallbackUsers.findIndex((u) => u.email.toLowerCase() === target);
  if (idx !== -1) {
    fallbackUsers[idx].passwordHash = newPasswordHash;
    fallbackUsers[idx].updatedAt = new Date();
    return true;
  }

  return false;
}

/**
 * OTP Code Queries & Fallback Memory Store
 */
export type OtpRecord = {
  id: string;
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
};

if (!globalForStore.fallbackOtpCodes) {
  globalForStore.fallbackOtpCodes = [];
}

const fallbackOtpCodes = globalForStore.fallbackOtpCodes;

export async function createOtpCode(email: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    const { otpCodes } = await import("./schema");
    await db.insert(otpCodes).values({
      email: email.trim().toLowerCase(),
      code,
      expiresAt,
    });
  } catch (_e) {
    // ignore
  }

  fallbackOtpCodes.push({
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    code,
    expiresAt,
    createdAt: new Date(),
  });

  return code;
}

export async function verifyOtpCode(email: string, code: string): Promise<boolean> {
  const emailClean = email.trim().toLowerCase();
  const codeClean = code.trim();
  const now = new Date();

  // Try DB first
  try {
    const { otpCodes } = await import("./schema");
    const rows = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          sql`lower(${otpCodes.email}) = ${emailClean}`,
          eq(otpCodes.code, codeClean),
        ),
      );

    const validRow = rows.find((r) => r.expiresAt > now);
    if (validRow) return true;
  } catch (_e) {
    // fallback
  }

  // Check fallback memory store
  const validMem = fallbackOtpCodes.find(
    (o) => o.email === emailClean && o.code === codeClean && o.expiresAt > now,
  );

  return Boolean(validMem);
}






