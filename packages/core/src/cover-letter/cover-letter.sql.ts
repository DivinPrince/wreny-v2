import { boolean, pgTable } from "drizzle-orm/pg-core";

import type { CoverLetterDocument } from "../schemas/cover-letter";
import { id, jsonb, text, timestamps, ulid } from "../drizzle/types";
import { userTable } from "../user/user.sql";

export const coverLetterTable = pgTable("cover_letter", {
  ...id,
  userId: ulid("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  data: jsonb("data").$type<CoverLetterDocument>().notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  ...timestamps,
});

export type CoverLetter = typeof coverLetterTable.$inferSelect;
export type NewCoverLetter = typeof coverLetterTable.$inferInsert;
