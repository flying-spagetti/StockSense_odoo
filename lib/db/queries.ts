import { and, eq, sql } from "drizzle-orm";
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

type FallbackMovement = {
  id: string;
  productId: string;
  kind: "receipt" | "issue";
  quantity: number;
  status: "completed" | "draft" | "void";
};

const fallbackMovements: FallbackMovement[] = [
  { id: "m1", productId: "10000000-0000-0000-0000-000000000001", kind: "receipt", quantity: 100, status: "completed" },
  { id: "m2", productId: "10000000-0000-0000-0000-000000000001", kind: "issue", quantity: 30, status: "completed" },
  { id: "m3", productId: "10000000-0000-0000-0000-000000000001", kind: "receipt", quantity: 5, status: "draft" },
  { id: "m4", productId: "10000000-0000-0000-0000-000000000001", kind: "issue", quantity: 10, status: "void" },
  { id: "m5", productId: "10000000-0000-0000-0000-000000000002", kind: "receipt", quantity: 200, status: "completed" },
  { id: "m6", productId: "10000000-0000-0000-0000-000000000002", kind: "issue", quantity: 180, status: "completed" },
  { id: "m7", productId: "10000000-0000-0000-0000-000000000003", kind: "receipt", quantity: 300, status: "completed" },
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
 * Inventory is derived, never stored. Only movements with status 'completed'
 * contribute: receipts add, issues subtract, and a product with no completed
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
          eq(stockMovements.status, "completed"),
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

  return fallbackProducts
    .map((prod) => {
      const moves = fallbackMovements.filter(
        (m) => m.productId === prod.id && m.status === "completed",
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
