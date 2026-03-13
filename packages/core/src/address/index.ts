import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import { addressTable } from "./address.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./address.sql";

export namespace AddressService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Address ID" }),
      userId: z.string().meta({ description: "User ID" }),
      type: z
        .string()
        .meta({ description: "Address type (shipping/billing)" }),
      firstName: z.string().meta({ description: "First name" }),
      lastName: z.string().meta({ description: "Last name" }),
      company: z.string().nullable().meta({ description: "Company name" }),
      street1: z.string().meta({ description: "Street address line 1" }),
      street2: z
        .string()
        .nullable()
        .meta({ description: "Street address line 2" }),
      city: z.string().meta({ description: "City" }),
      state: z.string().nullable().meta({ description: "State/Province" }),
      postalCode: z
        .string()
        .nullable()
        .meta({ description: "Postal/ZIP code" }),
      country: z.string().meta({ description: "Country" }),
      phone: z.string().nullable().meta({ description: "Phone number" }),
      isDefault: z.boolean().meta({ description: "Is default address" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "Address", description: "User address" });

  export const CreateInput = z.object({
    userId: z.string(),
    type: z.enum(["shipping", "billing"]).optional(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    company: z.string().optional(),
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1).max(100),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(1).max(100),
    phone: z.string().optional(),
    isDefault: z.boolean().optional(),
  });

  export const UpdateInput = CreateInput.omit({ userId: true })
    .partial()
    .extend({
      id: z.string(),
    });

  export const listByUser = fn(z.string(), async (userId) => {
    return withTransaction(async (tx) => {
      return tx
        .select()
        .from(addressTable)
        .where(eq(addressTable.userId, userId))
        .orderBy(asc(addressTable.createdAt));
    });
  });

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [address] = await tx
        .select()
        .from(addressTable)
        .where(eq(addressTable.id, id));
      return address;
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await tx
          .update(addressTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(addressTable.userId, input.userId),
              eq(addressTable.type, input.type || "shipping"),
            ),
          );
      }

      const id = createID("address");
      const [address] = await tx
        .insert(addressTable)
        .values({ id, ...input })
        .returning();
      return address;
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    const { id, ...data } = input;
    return withTransaction(async (tx) => {
      // Get the address first to know userId
      const [existing] = await tx
        .select()
        .from(addressTable)
        .where(eq(addressTable.id, id));

      if (!existing) throw new NotFoundError("Address", id);

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await tx
          .update(addressTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(addressTable.userId, existing.userId),
              eq(addressTable.type, existing.type),
            ),
          );
      }

      const [address] = await tx
        .update(addressTable)
        .set(data)
        .where(eq(addressTable.id, id))
        .returning();
      return address;
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [address] = await tx
        .delete(addressTable)
        .where(eq(addressTable.id, id))
        .returning();
      if (!address) throw new NotFoundError("Address", id);
      return address;
    });
  });
}

export type AddressInfo = z.infer<typeof AddressService.Info>;
export type AddressCreateInput = z.infer<typeof AddressService.CreateInput>;
export type AddressUpdateInput = z.infer<typeof AddressService.UpdateInput>;
