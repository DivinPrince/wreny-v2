import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import { brandTable } from "./brand.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./brand.sql";

export namespace BrandService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Brand ID" }),
      name: z.string().meta({ description: "Brand name" }),
      slug: z.string().meta({ description: "URL-friendly slug" }),
      logo: z.string().nullable().meta({ description: "Brand logo URL" }),
      description: z
        .string()
        .nullable()
        .meta({ description: "Brand description" }),
      isActive: z.boolean().meta({ description: "Is brand active" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "Brand", description: "Product brand" });

  export const CreateInput = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    logo: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  export const UpdateInput = CreateInput.partial().extend({
    id: z.string(),
  });

  export const list = fn(
    z.object({ isActive: z.boolean().optional() }).optional(),
    async (input) => {
      return withTransaction(async (tx) => {
        const query = tx
          .select()
          .from(brandTable)
          .orderBy(asc(brandTable.name));

        if (input?.isActive !== undefined) {
          return query.where(eq(brandTable.isActive, input.isActive));
        }
        return query;
      });
    },
  );

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [brand] = await tx
        .select()
        .from(brandTable)
        .where(eq(brandTable.id, id));
      return brand;
    });
  });

  export const bySlug = fn(z.string(), async (slug) => {
    return withTransaction(async (tx) => {
      const [brand] = await tx
        .select()
        .from(brandTable)
        .where(eq(brandTable.slug, slug));
      return brand;
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const id = createID("brand");
      const [brand] = await tx
        .insert(brandTable)
        .values({
          id,
          ...input,
        })
        .returning();
      return brand;
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    const { id, ...data } = input;
    return withTransaction(async (tx) => {
      const [brand] = await tx
        .update(brandTable)
        .set(data)
        .where(eq(brandTable.id, id))
        .returning();
      if (!brand) throw new NotFoundError("Brand", id);
      return brand;
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [brand] = await tx
        .delete(brandTable)
        .where(eq(brandTable.id, id))
        .returning();
      if (!brand) throw new NotFoundError("Brand", id);
      return brand;
    });
  });
}
