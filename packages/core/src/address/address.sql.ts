import { pgTable, varchar, text, boolean } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";
import { userTable } from "../user/user.sql";

export const addressTable = pgTable("address", {
  ...id,
  userId: ulid("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).default("shipping").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }),
  street1: text("street1").notNull(),
  street2: text("street2"),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  isDefault: boolean("is_default").default(false).notNull(),
  ...timestamps,
});

export type Address = typeof addressTable.$inferSelect;
export type NewAddress = typeof addressTable.$inferInsert;
