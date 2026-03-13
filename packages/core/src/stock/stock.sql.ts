import { pgTable, varchar, text, integer, unique } from "drizzle-orm/pg-core";
import { id, timestamps, ulid, dollar, timestamp } from "../drizzle/types";
import { productTable, productVariantTable } from "../product/product.sql";
import { locationTable } from "../location/location.sql";
import { supplierTable } from "../supplier/supplier.sql";
import { userTable } from "../user/user.sql";

export type StockCondition = "new" | "used" | "refurbished";
export type StockMovementType =
  | "in"
  | "out"
  | "adjustment"
  | "transfer"
  | "return";

export const productStockTable = pgTable(
  "product_stock",
  {
    ...id,
    productId: ulid("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    variantId: ulid("variant_id").references(() => productVariantTable.id, {
      onDelete: "cascade",
    }),
    locationId: ulid("location_id")
      .notNull()
      .references(() => locationTable.id, { onDelete: "cascade" }),

    quantity: integer("quantity").default(0).notNull(),
    condition: varchar("condition", { length: 20 })
      .$type<StockCondition>()
      .default("new")
      .notNull(),

    costPrice: dollar("cost_price"),
    reorderLevel: integer("reorder_level").default(5),
    reorderQuantity: integer("reorder_quantity").default(10),

    supplierId: ulid("supplier_id").references(() => supplierTable.id, {
      onDelete: "set null",
    }),
    batchNumber: varchar("batch_number", { length: 100 }),
    lastRestockedAt: timestamp("last_restocked_at"),
    ...timestamps,
  },
  (t) => [
    unique("product_stock_unique").on(
      t.productId,
      t.variantId,
      t.locationId,
      t.condition,
    ),
  ],
);

export const stockMovementTable = pgTable("stock_movement", {
  ...id,
  productStockId: ulid("product_stock_id")
    .notNull()
    .references(() => productStockTable.id, { onDelete: "cascade" }),
  productId: ulid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  locationId: ulid("location_id")
    .notNull()
    .references(() => locationTable.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 })
    .$type<StockMovementType>()
    .notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  referenceId: varchar("reference_id", { length: 100 }),
  performedBy: ulid("performed_by").references(() => userTable.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export type ProductStock = typeof productStockTable.$inferSelect;
export type NewProductStock = typeof productStockTable.$inferInsert;
export type StockMovement = typeof stockMovementTable.$inferSelect;
export type NewStockMovement = typeof stockMovementTable.$inferInsert;
