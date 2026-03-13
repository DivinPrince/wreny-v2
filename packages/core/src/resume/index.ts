import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { withTransaction } from "../drizzle/transaction";
import { NotFoundError } from "../error";
import { defaultResumeDocument, resumeDocumentSchema } from "../schemas/resume";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { resumeTable } from "./resume.sql";

export * from "./resume.sql";

export namespace ResumeService {
  export const Document = resumeDocumentSchema.meta({
    ref: "ResumeDocument",
    description: "Structured resume document data",
  });

  export const Info = z
    .object({
      id: z.string().meta({ description: "Resume ID" }),
      userId: z.string().meta({ description: "Owner user ID" }),
      title: z.string().meta({ description: "Resume title" }),
      data: Document,
      isDefault: z.boolean().meta({ description: "Whether this is the default resume" }),
      createdAt: z.date().meta({ description: "Creation date" }),
      updatedAt: z.date().meta({ description: "Last update date" }),
    })
    .meta({ ref: "Resume", description: "Resume record" });

  export const CreateInput = z.object({
    userId: z.string(),
    title: z.string().min(1).max(255),
    data: Document.default(defaultResumeDocument),
    isDefault: z.boolean().optional(),
  });

  export const UpdateInput = z.object({
    id: z.string(),
    title: z.string().min(1).max(255).optional(),
    data: Document.optional(),
    isDefault: z.boolean().optional(),
  });

  export const ListByUserInput = z.object({
    userId: z.string(),
  });

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [resume] = await tx
        .select()
        .from(resumeTable)
        .where(eq(resumeTable.id, id))
        .limit(1);

      return resume ? serialize(resume) : undefined;
    });
  });

  export const listByUser = fn(ListByUserInput, async ({ userId }) => {
    return withTransaction(async (tx) => {
      const resumes = await tx
        .select()
        .from(resumeTable)
        .where(eq(resumeTable.userId, userId))
        .orderBy(asc(resumeTable.createdAt));

      return resumes.map(serialize);
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      if (input.isDefault) {
        await tx
          .update(resumeTable)
          .set({ isDefault: false })
          .where(eq(resumeTable.userId, input.userId));
      }

      const [resume] = await tx
        .insert(resumeTable)
        .values({
          id: createID("resume"),
          userId: input.userId,
          title: input.title,
          data: input.data,
          isDefault: input.isDefault ?? false,
        })
        .returning();

      if (!resume) {
        throw new Error("Failed to create resume.");
      }

      return serialize(resume);
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    return withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(resumeTable)
        .where(eq(resumeTable.id, input.id))
        .limit(1);

      if (!existing) {
        throw new NotFoundError("Resume", input.id);
      }

      if (input.isDefault) {
        await tx
          .update(resumeTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(resumeTable.userId, existing.userId),
              eq(resumeTable.isDefault, true),
            ),
          );
      }

      const { id, ...data } = input;
      const [resume] = await tx
        .update(resumeTable)
        .set(data)
        .where(eq(resumeTable.id, id))
        .returning();

      if (!resume) {
        throw new NotFoundError("Resume", id);
      }

      return serialize(resume);
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [resume] = await tx
        .delete(resumeTable)
        .where(eq(resumeTable.id, id))
        .returning();

      if (!resume) {
        throw new NotFoundError("Resume", id);
      }

      return serialize(resume);
    });
  });

  function serialize(resume: typeof resumeTable.$inferSelect): z.infer<typeof Info> {
    return {
      id: resume.id,
      userId: resume.userId,
      title: resume.title,
      data: resume.data,
      isDefault: resume.isDefault,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }
}

export type ResumeInfo = z.infer<typeof ResumeService.Info>;
export type ResumeCreateInput = z.infer<typeof ResumeService.CreateInput>;
export type ResumeUpdateInput = z.infer<typeof ResumeService.UpdateInput>;
