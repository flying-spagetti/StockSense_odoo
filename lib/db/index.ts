import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { stocksensePool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and set it before running the app.",
    );
  }

  return new Pool({ connectionString });
}

export const pool = globalForDb.stocksensePool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.stocksensePool = pool;
}

export const db = drizzle(pool, { schema });
