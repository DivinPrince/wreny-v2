import { BrandService } from "@repo/core/brand";
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

const brandIdSchema = z.object({
  id: z.string(),
});

const brandSlugSchema = z.object({
  slug: z.string(),
});

export const brandsApi = new Hono<AppEnv>()
  .get("/", validate("query", listQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const brands = await BrandService.list({
      isActive: parseBooleanFlag(query.isActive),
    });

    return ok(c, brands);
  })
  .get("/slug/:slug", validate("param", brandSlugSchema), async (c) => {
    const { slug } = c.req.valid("param");
    const brand = await BrandService.bySlug(slug);
    if (!brand) {
      throw notFound("Brand", slug);
    }

    return ok(c, brand);
  })
  .get("/:id", validate("param", brandIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const brand = await BrandService.byId(id);
    if (!brand) {
      throw notFound("Brand", id);
    }

    return ok(c, brand);
  })
  .post("/", requireAdmin, validate("json", BrandService.CreateInput), async (c) => {
    const brand = await BrandService.create(c.req.valid("json"));
    return ok(c, brand, 201);
  })
  .put(
    "/:id",
    requireAdmin,
    validate("param", brandIdSchema),
    validate("json", BrandService.UpdateInput.omit({ id: true })),
    async (c) => {
      const { id } = c.req.valid("param");
      const brand = await BrandService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, brand);
    },
  )
  .delete("/:id", requireAdmin, validate("param", brandIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await BrandService.remove(id);
    return success(c);
  });
