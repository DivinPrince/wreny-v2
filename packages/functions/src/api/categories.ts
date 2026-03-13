import { CategoryService } from "@repo/core/category";
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
  parentId: z.string().optional(),
});

const categoryIdSchema = z.object({
  id: z.string(),
});

const categorySlugSchema = z.object({
  slug: z.string(),
});

export const categoriesApi = new Hono<AppEnv>()
  .get("/", validate("query", listQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const categories = await CategoryService.list({
      isActive: parseBooleanFlag(query.isActive),
      parentId: query.parentId === "null" ? null : query.parentId,
    });

    return ok(c, categories);
  })
  .get("/tree", validate("query", listQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const categories = await CategoryService.listTree({
      isActive: parseBooleanFlag(query.isActive),
    });

    return ok(c, categories);
  })
  .get("/slug/:slug", validate("param", categorySlugSchema), async (c) => {
    const { slug } = c.req.valid("param");
    const category = await CategoryService.bySlug(slug);
    if (!category) {
      throw notFound("Category", slug);
    }

    return ok(c, category);
  })
  .get("/:id", validate("param", categoryIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const category = await CategoryService.byId(id);
    if (!category) {
      throw notFound("Category", id);
    }

    return ok(c, category);
  })
  .post("/", requireAdmin, validate("json", CategoryService.CreateInput), async (c) => {
    const category = await CategoryService.create(c.req.valid("json"));
    return ok(c, category, 201);
  })
  .put(
    "/:id",
    requireAdmin,
    validate("param", categoryIdSchema),
    validate("json", CategoryService.UpdateInput.omit({ id: true })),
    async (c) => {
      const { id } = c.req.valid("param");
      const category = await CategoryService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, category);
    },
  )
  .delete("/:id", requireAdmin, validate("param", categoryIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await CategoryService.remove(id);
    return success(c);
  });
