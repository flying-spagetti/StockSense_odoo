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
  unit: string;
  reorderLevel: number;
  onHand: number;
};

export async function listProducts(): Promise<ProductRow[]> {
  return db.select().from(products).orderBy(products.name);
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertProduct(values: {
  sku: string;
  name: string;
  unit: string;
  reorderLevel: number;
}): Promise<ProductRow> {
  const rows = await db
    .insert(products)
    .values(values)
    .onConflictDoNothing()
    .returning();

  if (rows.length === 0) {
    throw new DuplicateSkuError(values.sku);
  }

  return rows[0];
}

export async function updateProductById(
  id: string,
  values: { name: string; unit: string; reorderLevel: number },
): Promise<ProductRow | null> {
  const rows = await db
    .update(products)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  return rows[0] ?? null;
}

/**
 * Inventory is derived, never stored. Only movements with status 'completed'
 * contribute: receipts add, issues subtract, and a product with no completed
 * movements reports zero.
 */
export async function listInventory(): Promise<InventoryRow[]> {
  return db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
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
}
