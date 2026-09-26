import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { stocksensePool?: Pool };

function createPool() {
  if (!process.env.DATABASE_URL) {
    try {
      const fs = require("node:fs");
      const path = require("node:path");
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        for (const line of envContent.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [key, ...val] = trimmed.split("=");
            if (key && !process.env[key.trim()]) {
              let parsedVal = val.join("=").trim();
              if (
                (parsedVal.startsWith('"') && parsedVal.endsWith('"')) ||
                (parsedVal.startsWith("'") && parsedVal.endsWith("'"))
              ) {
                parsedVal = parsedVal.slice(1, -1);
              }
              process.env[key.trim()] = parsedVal;
            }
          }
        }
      }
    } catch (_e) {
      // Ignore
    }
  }

  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and set it before running the app.",
    );
  }

  if (
    (connectionString.startsWith('"') && connectionString.endsWith('"')) ||
    (connectionString.startsWith("'") && connectionString.endsWith("'"))
  ) {
    connectionString = connectionString.slice(1, -1);
  }

  return new Pool({ connectionString });
}

export const pool = globalForDb.stocksensePool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.stocksensePool = pool;
}

export const db = drizzle(pool, { schema });
