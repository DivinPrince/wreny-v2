import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";

export const categoryTable = pgTable("category", {
  ...id,
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  icon: text("icon"),
  parentId: ulid("parent_id").references(() => categoryTable.id, {
    onDelete: "set null",
  }),
  sortOrder: integer("sort_order").default(0),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export type Category = typeof categoryTable.$inferSelect;
export type NewCategory = typeof categoryTable.$inferInsert;
