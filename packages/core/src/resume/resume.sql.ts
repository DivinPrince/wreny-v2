import { boolean, pgTable } from "drizzle-orm/pg-core";

import type { ResumeDocument } from "../schemas/resume";
import { id, jsonb, text, timestamps, ulid } from "../drizzle/types";
import { userTable } from "../user/user.sql";

export const resumeTable = pgTable("resume", {
  ...id,
  userId: ulid("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  data: jsonb("data").$type<ResumeDocument>().notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  ...timestamps,
});

export type Resume = typeof resumeTable.$inferSelect;
export type NewResume = typeof resumeTable.$inferInsert;
