import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const movementKind = pgEnum("movement_kind", [
  "receipt",
  "issue",
  "transfer",
  "adjustment",
]);

export const movementStatus = pgEnum("movement_status", [
  "draft",
  "waiting",
  "ready",
  "done",
  "canceled",
]);

/**
 * Products hold descriptive data only.
 * There is deliberately no stock/quantity column: on-hand quantity is always
 * derived by aggregating done stock movements (see lib/db/queries.ts).
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull().default("General"),
    unit: text("unit").notNull().default("unit"),
    reorderLevel: integer("reorder_level").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("products_sku_unique").on(table.sku),
    check("products_reorder_level_check", sql`${table.reorderLevel} >= 0`),
  ],
);

/**
 * Append-only stock movements. A movement only affects inventory when its
 * status is 'done'; 'draft', 'waiting', 'ready', and 'canceled' rows are ignored by the derived
 * inventory query.
 */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference"),
    supplier: text("supplier"),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    kind: movementKind("kind").notNull(),
    quantity: integer("quantity").notNull(),
    status: movementStatus("status").notNull().default("draft"),
    fromLocationId: text("from_location_id"),
    toLocationId: text("to_location_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("stock_movements_quantity_check", sql`${table.quantity} > 0`),
    index("stock_movements_product_id_idx").on(table.productId),
    index("stock_movements_status_idx").on(table.status),
  ],
);

export type Product = typeof products.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type MovementKind = (typeof movementKind.enumValues)[number];
export type MovementStatus = (typeof movementStatus.enumValues)[number];

export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("warehouses_code_unique").on(table.code),
  ],
);

export type Warehouse = typeof warehouses.$inferSelect;

export const userRole = pgEnum("user_role", [
  "inventory_manager",
  "warehouse_staff",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    loginId: text("login_id").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("inventory_manager"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_login_id_unique").on(table.loginId),
    uniqueIndex("users_email_unique").on(table.email),
  ],
);

export type User = typeof users.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("otp_codes_email_idx").on(table.email),
  ],
);

export type OtpCode = typeof otpCodes.$inferSelect;



