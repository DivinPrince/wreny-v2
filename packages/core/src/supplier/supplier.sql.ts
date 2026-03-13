import {
  pgTable,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "../drizzle/types";

export const supplierTable = pgTable("supplier", {
  ...id,
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  website: varchar("website", { length: 255 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export type Supplier = typeof supplierTable.$inferSelect;
export type NewSupplier = typeof supplierTable.$inferInsert;
