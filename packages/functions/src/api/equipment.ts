import { EquipmentService } from "@repo/core/equipment";
import { Hono } from "hono";
import { z } from "zod";
import {
  type AppEnv,
  notFound,
  ok,
  parseBooleanFlag,
  requireAdmin,
  success,
  validate,
} from "./common";

const listQuerySchema = z.object({
  type: z
    .enum(["vehicle", "generator", "machinery", "electronics", "other"])
    .optional(),
  make: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

const equipmentIdSchema = z.object({
  id: z.string(),
});

const compatibilitySchema = z.object({
  productId: z.string(),
  equipmentId: z.string(),
  notes: z.string().optional(),
});

const compatibilityIdSchema = z.object({
  id: z.string(),
});

export const equipmentApi = new Hono<AppEnv>()
  .get("/", validate("query", listQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const equipment = await EquipmentService.list({
      type: query.type,
      make: query.make,
      isActive: parseBooleanFlag(query.isActive),
    });

    return ok(c, equipment);
  })
  .get("/makes", async (c) => {
    const makes = await EquipmentService.getMakes();
    return ok(c, makes);
  })
  .get("/:id", validate("param", equipmentIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const equipment = await EquipmentService.byId(id);
    if (!equipment) {
      throw notFound("Equipment", id);
    }

    return ok(c, equipment);
  })
  .get(
    "/:id/products",
    validate("param", equipmentIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const products = await EquipmentService.getByEquipment(id);
      return ok(c, products);
    },
  )
  .post(
    "/",
    requireAdmin,
    validate("json", EquipmentService.CreateInput),
    async (c) => {
      const equipment = await EquipmentService.create(c.req.valid("json"));
      return ok(c, equipment, 201);
    },
  )
  .put(
    "/:id",
    requireAdmin,
    validate("param", equipmentIdSchema),
    validate("json", EquipmentService.UpdateInput.omit({ id: true })),
    async (c) => {
      const { id } = c.req.valid("param");
      const equipment = await EquipmentService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, equipment);
    },
  )
  .delete(
    "/:id",
    requireAdmin,
    validate("param", equipmentIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      await EquipmentService.remove(id);
      return success(c);
    },
  )
  .post(
    "/compatibility",
    requireAdmin,
    validate("json", compatibilitySchema),
    async (c) => {
      const record = await EquipmentService.addCompatibility(
        c.req.valid("json"),
      );
      return ok(c, record, 201);
    },
  )
  .delete(
    "/compatibility/:id",
    requireAdmin,
    validate("param", compatibilityIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      await EquipmentService.removeCompatibility(id);
      return success(c);
    },
  );
