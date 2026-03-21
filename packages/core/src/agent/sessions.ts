import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { withTransaction } from "../drizzle/transaction";
import { NotFoundError } from "../error";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import type { ResumeAgentUIMessage } from "./index";
import { sessionsTable } from "./sessions.sql";

export * from "./sessions.sql";

export namespace SessionsService {
  export const CreateInput = z.object({
    userId: z.string(),
    documentType: z.enum(["resume", "cover_letter"]),
    documentId: z.string(),
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const id = createID("agent_session");
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
      documentType: z.enum(["resume", "cover_letter"]),
      documentId: z.string(),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        return tx
          .select({
            id: sessionsTable.id,
            documentType: sessionsTable.documentType,
            documentId: sessionsTable.documentId,
            createdAt: sessionsTable.createdAt,
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
