import { SupplierService } from "@repo/core/supplier";
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
  isActive: z.enum(["true", "false"]).optional(),
});

const supplierIdSchema = z.object({
  id: z.string(),
});

const supplierSlugSchema = z.object({
  slug: z.string(),
});

export const suppliersApi = new Hono<AppEnv>()
  .get("/", validate("query", listQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const suppliers = await SupplierService.list({
      isActive: parseBooleanFlag(query.isActive),
    });

    return ok(c, suppliers);
  })
  .get("/slug/:slug", validate("param", supplierSlugSchema), async (c) => {
    const { slug } = c.req.valid("param");
    const supplier = await SupplierService.bySlug(slug);
    if (!supplier) {
      throw notFound("Supplier", slug);
    }

    return ok(c, supplier);
  })
  .get("/:id", validate("param", supplierIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const supplier = await SupplierService.byId(id);
    if (!supplier) {
      throw notFound("Supplier", id);
    }

    return ok(c, supplier);
  })
  .post(
    "/",
    requireAdmin,
    validate("json", SupplierService.CreateInput),
    async (c) => {
      const supplier = await SupplierService.create(c.req.valid("json"));
      return ok(c, supplier, 201);
    },
  )
  .put(
    "/:id",
    requireAdmin,
    validate("param", supplierIdSchema),
    validate("json", SupplierService.UpdateInput.omit({ id: true })),
    async (c) => {
      const { id } = c.req.valid("param");
      const supplier = await SupplierService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, supplier);
    },
  )
  .delete(
    "/:id",
    requireAdmin,
    validate("param", supplierIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      await SupplierService.remove(id);
      return success(c);
    },
  );
