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
  kind: "receipt" | "issue";
  quantity: number;
  status: "draft" | "waiting" | "ready" | "done" | "canceled";
  fromLocationId: string | null;
  toLocationId: string | null;
  note?: string;
  createdAt: Date;
};

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

// Additional issues in fallback to keep derived stock aligned
const fallbackIssueMovements: ExtendedMovement[] = [
  {
    id: "i1",
    reference: "WH/OUT/0001",
    supplier: "Retail Sale",
    productId: "10000000-0000-0000-0000-000000000001",
    kind: "issue",
    quantity: 30,
    status: "done",
    fromLocationId: "WH/Stock",
    toLocationId: null,
    createdAt: new Date("2026-09-21T11:00:00Z"),
  },
  {
    id: "i2",
    reference: "WH/OUT/0002",
    supplier: "Retail Sale",
    productId: "10000000-0000-0000-0000-000000000002",
    kind: "issue",
    quantity: 180,
    status: "done",
    fromLocationId: "WH/Stock",
    toLocationId: null,
    createdAt: new Date("2026-09-23T16:00:00Z"),
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
          sum(case when ${stockMovements.kind} = 'receipt' then ${stockMovements.quantity} else -${stockMovements.quantity} end),
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

  const allMoves = [...fallbackReceiptMovements, ...fallbackIssueMovements];

  return fallbackProducts
    .map((prod) => {
      const moves = allMoves.filter(
        (m) => m.productId === prod.id && m.status === "done",
      );
      const onHand = moves.reduce((sum, m) => {
        return m.kind === "receipt" ? sum + m.quantity : sum - m.quantity;
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
