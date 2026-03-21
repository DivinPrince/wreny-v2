import { pgTable, text } from "drizzle-orm/pg-core";

import { id, jsonb, timestamps, ulid } from "../drizzle/types";
import { userTable } from "../user/user.sql";

/** UIMessage shape for agent chat - matches ResumeAgentUIMessage */
type SessionMessage = { id: string; role: string; parts: unknown[] };

export const sessionsTable = pgTable("sessions", {
  ...id,
  userId: ulid("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  documentType: text("document_type")
    .$type<"resume" | "cover_letter">()
    .notNull(),
  documentId: text("document_id").notNull(),
  messages: jsonb("messages").$type<SessionMessage[]>().notNull().default([]),
  ...timestamps,
});

export type Session = typeof sessionsTable.$inferSelect;
export type NewSession = typeof sessionsTable.$inferInsert;
