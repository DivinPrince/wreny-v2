import { eq, and, asc, type SQL } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import {
  equipmentTable,
  productCompatibilityTable,
} from "./equipment.sql";
import { productTable } from "../product/product.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./equipment.sql";

export namespace EquipmentService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Equipment ID" }),
      make: z.string().meta({ description: "Manufacturer/make" }),
      model: z.string().meta({ description: "Model name" }),
      yearFrom: z
        .number()
        .nullable()
        .meta({ description: "Year range start" }),
      yearTo: z
        .number()
        .nullable()
        .meta({ description: "Year range end" }),
      type: z
        .enum(["vehicle", "generator", "machinery", "electronics", "other"])
        .meta({ description: "Equipment type" }),
      engineType: z
        .string()
        .nullable()
        .meta({ description: "Engine or power type" }),
      notes: z.string().nullable().meta({ description: "Notes" }),
      isActive: z.boolean().meta({ description: "Is active" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "Equipment", description: "Equipment/vehicle for part compatibility" });

  export const CompatibilityInfo = z
    .object({
      id: z.string().meta({ description: "Compatibility record ID" }),
      productId: z.string().meta({ description: "Product ID" }),
      equipmentId: z.string().meta({ description: "Equipment ID" }),
      notes: z.string().nullable().meta({ description: "Fitment notes" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({
      ref: "ProductCompatibility",
      description: "Product-equipment compatibility mapping",
    });

  export const CreateInput = z.object({
    make: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
    yearFrom: z.number().optional(),
    yearTo: z.number().optional(),
    type: z.enum(["vehicle", "generator", "machinery", "electronics", "other"]),
    engineType: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  export const UpdateInput = CreateInput.partial().extend({
    id: z.string(),
  });

  export const ListInput = z
    .object({
      type: z
        .enum(["vehicle", "generator", "machinery", "electronics", "other"])
        .optional()
        .meta({ description: "Filter by equipment type" }),
      make: z.string().optional().meta({ description: "Filter by make" }),
      isActive: z.boolean().optional().meta({ description: "Filter by active status" }),
    })
    .optional();

  export const list = fn(ListInput, async (input) => {
    return withTransaction(async (tx) => {
      const conditions: SQL[] = [];

      if (input?.type) {
        conditions.push(eq(equipmentTable.type, input.type));
      }
      if (input?.make) {
        conditions.push(eq(equipmentTable.make, input.make));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(equipmentTable.isActive, input.isActive));
      }

      const query = tx
        .select()
        .from(equipmentTable)
        .orderBy(asc(equipmentTable.make), asc(equipmentTable.model));

      if (conditions.length > 0) {
        return query.where(and(...conditions));
      }
      return query;
    });
  });

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [equipment] = await tx
        .select()
        .from(equipmentTable)
        .where(eq(equipmentTable.id, id));
      return equipment;
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const id = createID("equipment");
      const [equipment] = await tx
        .insert(equipmentTable)
        .values({ id, ...input })
        .returning();
      return equipment;
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    const { id, ...data } = input;
    return withTransaction(async (tx) => {
      const [equipment] = await tx
        .update(equipmentTable)
        .set(data)
        .where(eq(equipmentTable.id, id))
        .returning();
      if (!equipment) throw new NotFoundError("Equipment", id);
      return equipment;
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [equipment] = await tx
        .delete(equipmentTable)
        .where(eq(equipmentTable.id, id))
        .returning();
      if (!equipment) throw new NotFoundError("Equipment", id);
      return equipment;
    });
  });

  /** Get unique makes for filter dropdowns */
  export const getMakes = fn(z.void(), async () => {
    return withTransaction(async (tx) => {
      const results = await tx
        .selectDistinct({ make: equipmentTable.make })
        .from(equipmentTable)
        .where(eq(equipmentTable.isActive, true))
        .orderBy(asc(equipmentTable.make));
      return results.map((r) => r.make);
    });
  });

  // --- Compatibility ---

  export const addCompatibility = fn(
    z.object({
      productId: z.string(),
      equipmentId: z.string(),
      notes: z.string().optional(),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const id = createID("product_compatibility");
        const [record] = await tx
          .insert(productCompatibilityTable)
          .values({ id, ...input })
          .returning();
        return record;
      });
    },
  );

  export const removeCompatibility = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [record] = await tx
        .delete(productCompatibilityTable)
        .where(eq(productCompatibilityTable.id, id))
        .returning();
      if (!record) throw new NotFoundError("ProductCompatibility", id);
      return record;
    });
  });

  /** Get all equipment compatible with a product */
  export const getByProduct = fn(z.string(), async (productId) => {
    return withTransaction(async (tx) => {
      return tx
        .select({
          compatibility: productCompatibilityTable,
          equipment: equipmentTable,
        })
        .from(productCompatibilityTable)
        .innerJoin(
          equipmentTable,
          eq(productCompatibilityTable.equipmentId, equipmentTable.id),
        )
        .where(eq(productCompatibilityTable.productId, productId))
        .orderBy(asc(equipmentTable.make), asc(equipmentTable.model));
    });
  });

  /** Get all products compatible with an equipment */
  export const getByEquipment = fn(z.string(), async (equipmentId) => {
    return withTransaction(async (tx) => {
      return tx
        .select({
          compatibility: productCompatibilityTable,
          product: {
            id: productTable.id,
            name: productTable.name,
            partNumber: productTable.partNumber,
            slug: productTable.slug,
          },
        })
        .from(productCompatibilityTable)
        .innerJoin(
          productTable,
          eq(productCompatibilityTable.productId, productTable.id),
        )
        .where(eq(productCompatibilityTable.equipmentId, equipmentId))
        .orderBy(asc(productTable.name));
    });
  });
}
