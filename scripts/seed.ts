import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

if (!process.env.DATABASE_URL && existsSync(resolve(process.cwd(), ".env"))) {
  const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...val] = trimmed.split("=");
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val.join("=").trim();
      }
    }
  }
}

import { db, pool } from "../lib/db";
import { listInventory } from "../lib/db/queries";
import { products, stockMovements } from "../lib/db/schema";

const seedProducts = [
  { sku: "SKU-1001", name: "Cotton T-Shirt", category: "Apparel", unit: "pcs", reorderLevel: 20 },
  { sku: "SKU-1002", name: "Ceramic Mug", category: "Homeware", unit: "pcs", reorderLevel: 50 },
  { sku: "SKU-1003", name: "A5 Notebook", category: "Stationery", unit: "pcs", reorderLevel: 100 },
  { sku: "SKU-1004", name: "Desk Lamp", category: "Electronics", unit: "pcs", reorderLevel: 10 },
];

function idOf(idsBySku: Map<string, string>, sku: string): string {
  const id = idsBySku.get(sku);

  if (!id) {
    throw new Error(`Seed product "${sku}" was not inserted.`);
  }

  return id;
}

async function main() {
  console.log("Clearing products and stock movements...");
  await db.delete(stockMovements);
  await db.delete(products);

  const inserted = await db
    .insert(products)
    .values(seedProducts)
    .returning({ id: products.id, sku: products.sku });

  const idsBySku = new Map(inserted.map((row) => [row.sku, row.id]));

  await db.insert(stockMovements).values([
    // 100 received, 30 issued, 5 drafted, 10 voided -> 70 on hand.
    {
      productId: idOf(idsBySku, "SKU-1001"),
      kind: "receipt",
      quantity: 100,
      status: "completed",
      note: "Opening stock",
    },
    {
      productId: idOf(idsBySku, "SKU-1001"),
      kind: "issue",
      quantity: 30,
      status: "completed",
      note: "Shop sale",
    },
    {
      productId: idOf(idsBySku, "SKU-1001"),
      kind: "receipt",
      quantity: 5,
      status: "draft",
      note: "Not counted until completed",
    },
    {
      productId: idOf(idsBySku, "SKU-1001"),
      kind: "issue",
      quantity: 10,
      status: "void",
      note: "Entered in error",
    },
    // 200 received, 180 issued -> 20 on hand, below the reorder level.
    {
      productId: idOf(idsBySku, "SKU-1002"),
      kind: "receipt",
      quantity: 200,
      status: "completed",
    },
    {
      productId: idOf(idsBySku, "SKU-1002"),
      kind: "issue",
      quantity: 180,
      status: "completed",
    },
    // 300 received, nothing issued -> 300 on hand.
    {
      productId: idOf(idsBySku, "SKU-1003"),
      kind: "receipt",
      quantity: 300,
      status: "completed",
    },
    // No movements at all -> 0 on hand.
  ]);

  const inventory = await listInventory();

  console.log("\nDerived inventory (completed movements only):");

  for (const row of inventory) {
    console.log(
      `  ${row.sku}  ${row.onHand} ${row.unit}  (reorder at ${row.reorderLevel})`,
    );
  }
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
