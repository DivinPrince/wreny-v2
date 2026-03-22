import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { withTransaction } from "../drizzle/transaction";
import { ErrorCodes, NotFoundError, VisibleError } from "../error";
import { fn } from "../util/fn";
import { createID, isAgentSessionId } from "../util/id";
import type { ResumeAgentUIMessage } from "./index";
import { sessionsTable } from "./sessions.sql";

export * from "./sessions.sql";

const PREVIEW_MAX = 72;

export namespace SessionsService {
  export const CreateInput = z.object({
    userId: z.string(),
    documentType: z.enum(["resume", "cover_letter", "general"]),
    documentId: z.string(),
    /** Client-generated id (OpenCode-style URL-first); must be a valid agent session id. */
    id: z.string().optional(),
  });

  export const create = fn(CreateInput, async (input) => {
    if (input.id !== undefined && !isAgentSessionId(input.id)) {
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_FORMAT,
        "Invalid agent session id format",
        "id",
      );
    }

    const id = input.id ?? createID("agent_session");

    return withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, id))
        .limit(1);

      if (existing) {
        if (existing.userId !== input.userId) {
          throw new VisibleError(
            "forbidden",
            ErrorCodes.Permission.FORBIDDEN,
            "This session id is not available",
          );
        }
        if (
          existing.documentType !== input.documentType ||
          existing.documentId !== input.documentId
        ) {
          throw new VisibleError(
            "validation",
            ErrorCodes.Validation.INVALID_PARAMETER,
            "Session id is already used in a different context",
            "id",
          );
        }
        return existing;
      }

      const [session] = await tx
        .insert(sessionsTable)
        .values({
          id,
          userId: input.userId,
          documentType: input.documentType,
          documentId: input.documentId,
          messages: [],
        })
        .returning();
      if (!session) throw new Error("Failed to create session");
      return session;
    });
  });

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, id))
        .limit(1);
      return session ?? undefined;
    });
  });

  export const listByDocument = fn(
    z.object({
      userId: z.string(),
      documentType: z.enum(["resume", "cover_letter", "general"]),
      documentId: z.string(),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const rows = await tx
          .select({
            id: sessionsTable.id,
            documentType: sessionsTable.documentType,
            documentId: sessionsTable.documentId,
            createdAt: sessionsTable.createdAt,
            preview: sql<string | null>`(
              SELECT CASE
                WHEN preview.text_value = '' THEN NULL
                WHEN length(preview.text_value) <= ${PREVIEW_MAX} THEN preview.text_value
                ELSE left(preview.text_value, ${PREVIEW_MAX - 1}) || '…'
              END
              FROM (
                SELECT trim(
                  regexp_replace(
                    coalesce(string_agg(part.value->>'text', '' ORDER BY part.ord), ''),
                    '^The user attached the dashboard (resume|cover letter) "[^"]+". Use documentType "(resume|coverLetter)" and documentId "[^"]+" when calling (getResume|getCoverLetter) or proposeDocumentChanges for this document\\.[[:space:]]*',
                    ''
                  )
                ) AS text_value
                FROM (
                  SELECT msg.value
                  FROM jsonb_array_elements(${sessionsTable.messages}) WITH ORDINALITY AS msg(value, ord)
                  WHERE msg.value->>'role' = 'user'
                  ORDER BY msg.ord
                  LIMIT 1
                ) first_user
                CROSS JOIN LATERAL jsonb_array_elements(coalesce(first_user.value->'parts', '[]'::jsonb)) WITH ORDINALITY AS part(value, ord)
                WHERE part.value->>'type' = 'text'
              ) preview
            )`,
          })
          .from(sessionsTable)
          .where(
            and(
              eq(sessionsTable.userId, input.userId),
              eq(sessionsTable.documentType, input.documentType),
              eq(sessionsTable.documentId, input.documentId),
            ),
          )
          .orderBy(desc(sessionsTable.createdAt));

        return rows.map((row) => ({
          id: row.id,
          documentType: row.documentType,
          documentId: row.documentId,
          createdAt: row.createdAt,
          preview: row.preview,
        }));
      });
    },
  );

  export const updateMessages = fn(
    z.object({
      id: z.string(),
      messages: z.array(z.any()),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(sessionsTable)
          .where(eq(sessionsTable.id, input.id))
          .limit(1);
        if (!existing) throw new NotFoundError("Session", input.id);
        const [session] = await tx
          .update(sessionsTable)
          .set({ messages: input.messages as ResumeAgentUIMessage[] })
          .where(eq(sessionsTable.id, input.id))
          .returning();
        if (!session) throw new NotFoundError("Session", input.id);
        return session;
      });
    },
  );

  export const loadMessages = fn(z.string(), async (id) => {
    const session = await byId(id);
    return (session?.messages ?? []) as ResumeAgentUIMessage[];
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [deleted] = await tx
        .delete(sessionsTable)
        .where(eq(sessionsTable.id, id))
        .returning();
      return deleted != null;
    });
  });
}
