import {
  pgTable,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "../drizzle/types";

export const brandTable = pgTable("brand", {
  ...id,
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export type Brand = typeof brandTable.$inferSelect;
export type NewBrand = typeof brandTable.$inferInsert;
