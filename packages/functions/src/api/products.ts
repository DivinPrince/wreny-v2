import { EquipmentService } from "@repo/core/equipment";
import { ProductService } from "@repo/core/product";
import { Hono } from "hono";
import { z } from "zod";
import {
  type AppEnv,
  notFound,
  ok,
  paginated,
  parseBooleanFlag,
  parseIntegerParam,
  parseNumberParam,
  requireAdmin,
  success,
  validate,
} from "./common";

const productIdSchema = z.object({
  id: z.string(),
});

const productSlugSchema = z.object({
  slug: z.string(),
});

const productListQuerySchema = ProductService.ListQueryInput;

const filterQuerySchema = ProductService.FilterQueryInput;

const createVariantSchema = z.object({
  name: z.string(),
  partNumber: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().optional(),
  condition: z
    .enum(["new", "used", "refurbished", "aftermarket"])
    .optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  images: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const productsApi = new Hono<AppEnv>()
  .get("/filters", validate("query", filterQuerySchema), async (c) => {
    const filters = await ProductService.getFilterOptions(c.req.valid("query"));
    return ok(c, filters);
  })
  .get("/", validate("query", productListQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const result = await ProductService.list({
      categoryId: query.categoryId,
      brandId: query.brandId,
      condition: query.condition,
      isActive: parseBooleanFlag(query.isActive),
      search: query.search,
      partNumber: query.partNumber,
      equipmentId: query.equipmentId,
      minPrice: parseNumberParam(query.minPrice),
      maxPrice: parseNumberParam(query.maxPrice),
      limit: parseIntegerParam(query.limit),
      offset: parseIntegerParam(query.offset),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return paginated(
      c,
      result.items,
      {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
      200,
    );
  })
  .get("/slug/:slug", validate("param", productSlugSchema), async (c) => {
    const { slug } = c.req.valid("param");
    const product = await ProductService.bySlugWithDetails(slug);
    if (!product) {
      throw notFound("Product", slug);
    }

    return ok(c, product);
  })
  .get(
    "/part/:partNumber",
    validate("param", z.object({ partNumber: z.string() })),
    async (c) => {
      const { partNumber } = c.req.valid("param");
      const product = await ProductService.byPartNumber(partNumber);
      if (!product) {
        throw notFound("Product", partNumber);
      }

      return ok(c, product);
    },
  )
  .get("/:id/equipment", validate("param", productIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const product = await ProductService.byId(id);
    if (!product) {
      throw notFound("Product", id);
    }

    const equipment = await EquipmentService.getByProduct(id);
    return ok(c, equipment);
  })
  .get("/:id/variants", validate("param", productIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const product = await ProductService.byId(id);
    if (!product) {
      throw notFound("Product", id);
    }

    const variants = await ProductService.getVariants(id);
    return ok(c, variants);
  })
  .get("/:id", validate("param", productIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const product = await ProductService.byIdWithDetails(id);
    if (!product) {
      throw notFound("Product", id);
    }

    return ok(c, product);
  })
  .post(
    "/",
    requireAdmin,
    validate("json", ProductService.CreateInput),
    async (c) => {
      const product = await ProductService.create(c.req.valid("json"));
      return ok(c, product, 201);
    },
  )
  .put(
    "/:id",
    requireAdmin,
    validate("param", productIdSchema),
    validate("json", ProductService.UpdateInput.omit({ id: true })),
    async (c) => {
      const { id } = c.req.valid("param");
      const product = await ProductService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, product);
    },
  )
  .delete("/:id", requireAdmin, validate("param", productIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await ProductService.remove(id);
    return success(c);
  })
  .post(
    "/:id/variants",
    requireAdmin,
    validate("param", productIdSchema),
    validate("json", createVariantSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const product = await ProductService.byId(id);
      if (!product) {
        throw notFound("Product", id);
      }

      const variant = await ProductService.createVariant({
        productId: id,
        ...c.req.valid("json"),
      });

      return ok(c, variant, 201);
    },
  );
