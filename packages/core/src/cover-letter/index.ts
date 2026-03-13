import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { withTransaction } from "../drizzle/transaction";
import { NotFoundError } from "../error";
import {
  coverLetterDocumentSchema,
  defaultCoverLetterDocument,
} from "../schemas/cover-letter";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { coverLetterTable } from "./cover-letter.sql";

export * from "./cover-letter.sql";

export namespace CoverLetterService {
  export const Document = coverLetterDocumentSchema.meta({
    ref: "CoverLetterDocument",
    description: "Structured cover letter document data",
  });

  export const Info = z
    .object({
      id: z.string().meta({ description: "Cover letter ID" }),
      userId: z.string().meta({ description: "Owner user ID" }),
      title: z.string().meta({ description: "Cover letter title" }),
      data: Document,
      isDefault: z
        .boolean()
        .meta({ description: "Whether this is the default cover letter" }),
      createdAt: z.date().meta({ description: "Creation date" }),
      updatedAt: z.date().meta({ description: "Last update date" }),
    })
    .meta({ ref: "CoverLetter", description: "Cover letter record" });

  export const CreateInput = z.object({
    userId: z.string(),
    title: z.string().min(1).max(255),
    data: Document.default(defaultCoverLetterDocument),
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
      const [coverLetter] = await tx
        .select()
        .from(coverLetterTable)
        .where(eq(coverLetterTable.id, id))
        .limit(1);

      return coverLetter ? serialize(coverLetter) : undefined;
    });
  });

  export const listByUser = fn(ListByUserInput, async ({ userId }) => {
    return withTransaction(async (tx) => {
      const coverLetters = await tx
        .select()
        .from(coverLetterTable)
        .where(eq(coverLetterTable.userId, userId))
        .orderBy(asc(coverLetterTable.createdAt));

      return coverLetters.map(serialize);
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      if (input.isDefault) {
        await tx
          .update(coverLetterTable)
          .set({ isDefault: false })
          .where(eq(coverLetterTable.userId, input.userId));
      }

      const [coverLetter] = await tx
        .insert(coverLetterTable)
        .values({
          id: createID("cover_letter"),
          userId: input.userId,
          title: input.title,
          data: input.data,
          isDefault: input.isDefault ?? false,
        })
        .returning();

      if (!coverLetter) {
        throw new Error("Failed to create cover letter.");
      }

      return serialize(coverLetter);
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    return withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(coverLetterTable)
        .where(eq(coverLetterTable.id, input.id))
        .limit(1);

      if (!existing) {
        throw new NotFoundError("CoverLetter", input.id);
      }

      if (input.isDefault) {
        await tx
          .update(coverLetterTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(coverLetterTable.userId, existing.userId),
              eq(coverLetterTable.isDefault, true),
            ),
          );
      }

      const { id, ...data } = input;
      const [coverLetter] = await tx
        .update(coverLetterTable)
        .set(data)
        .where(eq(coverLetterTable.id, id))
        .returning();

      if (!coverLetter) {
        throw new NotFoundError("CoverLetter", id);
      }

      return serialize(coverLetter);
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [coverLetter] = await tx
        .delete(coverLetterTable)
        .where(eq(coverLetterTable.id, id))
        .returning();

      if (!coverLetter) {
        throw new NotFoundError("CoverLetter", id);
      }

      return serialize(coverLetter);
    });
  });

  function serialize(
    coverLetter: typeof coverLetterTable.$inferSelect,
  ): z.infer<typeof Info> {
    return {
      id: coverLetter.id,
      userId: coverLetter.userId,
      title: coverLetter.title,
      data: coverLetter.data,
      isDefault: coverLetter.isDefault,
      createdAt: coverLetter.createdAt,
      updatedAt: coverLetter.updatedAt,
    };
  }
}

export type CoverLetterInfo = z.infer<typeof CoverLetterService.Info>;
export type CoverLetterCreateInput = z.infer<typeof CoverLetterService.CreateInput>;
export type CoverLetterUpdateInput = z.infer<typeof CoverLetterService.UpdateInput>;
