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

import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { listInventory } from "../lib/db/queries";
import { products, stockMovements, users, warehouses } from "../lib/db/schema";

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
  console.log("Ensuring database tables exist...");

  // Execute table DDL if missing or update existing tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      login_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'inventory_manager',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `);

  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'inventory_manager';
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS warehouses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `);

  console.log("Seeding demo user...");
  const passwordHash = bcrypt.hashSync("Demo@123", 10);
  
  await db
    .insert(users)
    .values({
      loginId: "demo_user",
      email: "demo@stocksense.app",
      passwordHash,
      role: "inventory_manager",
    })
    .onConflictDoUpdate({
      target: users.loginId,
      set: {
        email: "demo@stocksense.app",
        passwordHash,
        role: "inventory_manager",
        updatedAt: new Date(),
      },
    });

  console.log("Clearing products and stock movements...");
  await db.delete(stockMovements);
  await db.delete(products);

  const inserted = await db
    .insert(products)
    .values(seedProducts)
    .returning({ id: products.id, sku: products.sku });

  const idsBySku = new Map(inserted.map((row) => [row.sku, row.id]));

  await db.insert(stockMovements).values([
    // 100 received, 30 issued, 5 drafted, 10 canceled -> 70 on hand.
    {
      productId: idOf(idsBySku, "SKU-1001"),
      kind: "receipt",
      quantity: 100,
      status: "done",
      note: "Opening stock",
    },
    {
      productId: idOf(idsBySku, "SKU-1001"),
      kind: "issue",
      quantity: 30,
      status: "done",
      note: "Shop sale",
    },
    {
      productId: idOf(idsBySku, "SKU-1001"),
      kind: "receipt",
      quantity: 5,
      status: "draft",
      note: "Not counted until done",
    },
    {
      productId: idOf(idsBySku, "SKU-1001"),
      kind: "issue",
      quantity: 10,
      status: "canceled",
      note: "Entered in error",
    },
    // 200 received, 180 issued -> 20 on hand, below the reorder level.
    {
      productId: idOf(idsBySku, "SKU-1002"),
      kind: "receipt",
      quantity: 200,
      status: "done",
    },
    {
      productId: idOf(idsBySku, "SKU-1002"),
      kind: "issue",
      quantity: 180,
      status: "done",
    },
    // 300 received, nothing issued -> 300 on hand.
    {
      productId: idOf(idsBySku, "SKU-1003"),
      kind: "receipt",
      quantity: 300,
      status: "done",
    },
  ]);

  const inventory = await listInventory();

  console.log("\nDemo user seeded successfully:");
  console.log("  Login ID: demo_user");
  console.log("  Email:    demo@stocksense.app");
  console.log("  Password: Demo@123");

  console.log("\nDerived inventory (done movements only):");

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
