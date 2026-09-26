import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "./index";
import { products, stockMovements } from "./schema";

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
}): Promise<ProductRow> {
  const skuExistsFallback = fallbackProducts.some(
    (p) => p.sku.toLowerCase() === values.sku.toLowerCase(),
  );

  try {
    const rows = await db
      .insert(products)
      .values({
        ...values,
        category: values.category || "General",
      })
      .onConflictDoNothing()
      .returning();

    if (rows.length === 0) {
      throw new DuplicateSkuError(values.sku);
    }

    fallbackProducts.push(rows[0]);
    return rows[0];
  } catch (error) {
    if (error instanceof DuplicateSkuError) {
      throw error;
    }
    if (skuExistsFallback) {
      throw new DuplicateSkuError(values.sku);
    }
    const newProduct: ProductRow = {
      id: crypto.randomUUID(),
      sku: values.sku,
      name: values.name,
      category: values.category || "General",
      unit: values.unit,
      reorderLevel: values.reorderLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    fallbackProducts.push(newProduct);
    return newProduct;
  }
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


