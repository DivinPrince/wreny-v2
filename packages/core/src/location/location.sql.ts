import { pgTable, varchar, text, boolean } from "drizzle-orm/pg-core";
import { id, timestamps } from "../drizzle/types";

export const locationTable = pgTable("location", {
  ...id,
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  landmark: varchar("landmark", { length: 255 }),
  mobile: varchar("mobile", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export type Location = typeof locationTable.$inferSelect;
export type NewLocation = typeof locationTable.$inferInsert;
