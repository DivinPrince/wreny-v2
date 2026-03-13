import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";
import { productTable } from "../product/product.sql";

export type EquipmentType =
  | "vehicle"
  | "generator"
  | "machinery"
  | "electronics"
  | "other";

export const equipmentTable = pgTable("equipment", {
  ...id,
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  type: varchar("type", { length: 50 })
    .$type<EquipmentType>()
    .notNull(),
  engineType: varchar("engine_type", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const productCompatibilityTable = pgTable(
  "product_compatibility",
  {
    ...id,
    productId: ulid("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    equipmentId: ulid("equipment_id")
      .notNull()
      .references(() => equipmentTable.id, { onDelete: "cascade" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    unique("product_equipment_unique").on(t.productId, t.equipmentId),
  ],
);

export type Equipment = typeof equipmentTable.$inferSelect;
export type NewEquipment = typeof equipmentTable.$inferInsert;
export type ProductCompatibility =
  typeof productCompatibilityTable.$inferSelect;
export type NewProductCompatibility =
  typeof productCompatibilityTable.$inferInsert;
