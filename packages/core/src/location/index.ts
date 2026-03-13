import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import { locationTable } from "./location.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./location.sql";

export namespace LocationService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Location ID" }),
      name: z.string().meta({ description: "Location name" }),
      address: z.string().nullable().meta({ description: "Full address" }),
      landmark: z.string().nullable().meta({ description: "Landmark" }),
      mobile: z.string().nullable().meta({ description: "Phone number" }),
      email: z.string().nullable().meta({ description: "Email address" }),
      website: z.string().nullable().meta({ description: "Website URL" }),
      isActive: z.boolean().meta({ description: "Is location active" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "Location", description: "Store location" });

  export const CreateInput = z.object({
    name: z.string().min(1).max(255),
    address: z.string().optional(),
    landmark: z.string().optional(),
    mobile: z
      .string()
      .transform((val) => val || undefined)
      .optional(),
    email: z
      .string()
      .transform((val) => val || undefined)
      .optional(),
    website: z
      .string()
      .transform((val) => val || undefined)
      .optional(),
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
          .from(locationTable)
          .orderBy(asc(locationTable.name));

        if (input?.isActive !== undefined) {
          return query.where(eq(locationTable.isActive, input.isActive));
        }
        return query;
      });
    },
  );

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [location] = await tx
        .select()
        .from(locationTable)
        .where(eq(locationTable.id, id));
      return location;
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const id = createID("location");
      const [location] = await tx
        .insert(locationTable)
        .values({
          id,
          ...input,
        })
        .returning();
      return location;
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    const { id, ...data } = input;
    return withTransaction(async (tx) => {
      const [location] = await tx
        .update(locationTable)
        .set(data)
        .where(eq(locationTable.id, id))
        .returning();
      if (!location) throw new NotFoundError("Location", id);
      return location;
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [location] = await tx
        .delete(locationTable)
        .where(eq(locationTable.id, id))
        .returning();
      if (!location) throw new NotFoundError("Location", id);
      return location;
    });
  });
}
