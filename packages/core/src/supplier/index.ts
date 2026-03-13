import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import { supplierTable } from "./supplier.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./supplier.sql";

export namespace SupplierService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Supplier ID" }),
      name: z.string().meta({ description: "Supplier name" }),
      slug: z.string().meta({ description: "URL-friendly slug" }),
      contactPerson: z
        .string()
        .nullable()
        .meta({ description: "Primary contact person" }),
      email: z
        .string()
        .nullable()
        .meta({ description: "Contact email" }),
      phone: z
        .string()
        .nullable()
        .meta({ description: "Contact phone" }),
      address: z
        .string()
        .nullable()
        .meta({ description: "Supplier address" }),
      city: z.string().nullable().meta({ description: "City" }),
      country: z.string().nullable().meta({ description: "Country" }),
      website: z
        .string()
        .nullable()
        .meta({ description: "Website URL" }),
      notes: z.string().nullable().meta({ description: "Internal notes" }),
      isActive: z.boolean().meta({ description: "Is supplier active" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "Supplier", description: "Parts supplier" });

  export const CreateInput = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
    notes: z.string().optional(),
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
          .from(supplierTable)
          .orderBy(asc(supplierTable.name));

        if (input?.isActive !== undefined) {
          return query.where(eq(supplierTable.isActive, input.isActive));
        }
        return query;
      });
    },
  );

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [supplier] = await tx
        .select()
        .from(supplierTable)
        .where(eq(supplierTable.id, id));
      return supplier;
    });
  });

  export const bySlug = fn(z.string(), async (slug) => {
    return withTransaction(async (tx) => {
      const [supplier] = await tx
        .select()
        .from(supplierTable)
        .where(eq(supplierTable.slug, slug));
      return supplier;
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const id = createID("supplier");
      const [supplier] = await tx
        .insert(supplierTable)
        .values({ id, ...input })
        .returning();
      return supplier;
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    const { id, ...data } = input;
    return withTransaction(async (tx) => {
      const [supplier] = await tx
        .update(supplierTable)
        .set(data)
        .where(eq(supplierTable.id, id))
        .returning();
      if (!supplier) throw new NotFoundError("Supplier", id);
      return supplier;
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [supplier] = await tx
        .delete(supplierTable)
        .where(eq(supplierTable.id, id))
        .returning();
      if (!supplier) throw new NotFoundError("Supplier", id);
      return supplier;
    });
  });
}
