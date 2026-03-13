import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { id, timestamps, ulid, softDelete, dollar } from "../drizzle/types";
import { categoryTable } from "../category/category.sql";
import { brandTable } from "../brand/brand.sql";

export type ProductCondition = "new" | "used" | "refurbished" | "aftermarket";

export const productTable = pgTable("product", {
  ...id,
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  partNumber: varchar("part_number", { length: 100 }).notNull().unique(),
  oemNumber: varchar("oem_number", { length: 100 }),
  description: text("description"),
  shortDescription: text("short_description"),

  price: dollar("price").notNull(),
  wholesalePrice: dollar("wholesale_price"),
  costPrice: dollar("cost_price"),

  condition: varchar("condition", { length: 20 })
    .$type<ProductCondition>()
    .default("new")
    .notNull(),

  images: jsonb("images").$type<string[]>().default([]),
  categoryId: ulid("category_id").references(() => categoryTable.id, {
    onDelete: "set null",
  }),
  brandId: ulid("brand_id").references(() => brandTable.id, {
    onDelete: "set null",
  }),

  sku: varchar("sku", { length: 100 }),
  stock: integer("stock").default(0).notNull(),
  unit: varchar("unit", { length: 50 }),
  weight: integer("weight"),
  weightUnit: varchar("weight_unit", { length: 10 }).default("kg"),

  specifications: jsonb("specifications").$type<Record<string, string>>(),
  crossReferences: jsonb("cross_references").$type<string[]>().default([]),

  minOrderQuantity: integer("min_order_quantity").default(1).notNull(),
  warranty: varchar("warranty", { length: 100 }),
  leadTimeDays: integer("lead_time_days"),

  isActive: boolean("is_active").default(true).notNull(),
  meta: jsonb("meta").$type<Record<string, string>>(),
  ...timestamps,
  ...softDelete,
});

export const productVariantTable = pgTable("product_variant", {
  ...id,
  productId: ulid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  partNumber: varchar("part_number", { length: 100 }),
  sku: varchar("sku", { length: 100 }),
  price: dollar("price"),
  stock: integer("stock").default(0).notNull(),
  condition: varchar("condition", { length: 20 }).$type<ProductCondition>(),
  attributes: jsonb("attributes").$type<Record<string, string>>(),
  images: jsonb("images").$type<string[]>().default([]),
  isDefault: boolean("is_default").default(false).notNull(),
  sortOrder: integer("sort_order").default(0),
  ...timestamps,
});

export const productImageTable = pgTable("product_image", {
  ...id,
  productId: ulid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 255 }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamps.createdAt,
});

export type Product = typeof productTable.$inferSelect;
export type NewProduct = typeof productTable.$inferInsert;
export type ProductVariant = typeof productVariantTable.$inferSelect;
export type NewProductVariant = typeof productVariantTable.$inferInsert;
export type ProductImage = typeof productImageTable.$inferSelect;
export type NewProductImage = typeof productImageTable.$inferInsert;
