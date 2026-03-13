import { StockService } from "@repo/core/stock";
import { Hono } from "hono";
import { z } from "zod";
import {
  type AppEnv,
  ok,
  parseIntegerParam,
  requireAdmin,
  validate,
} from "./common";

const productIdSchema = z.object({
  productId: z.string(),
});

const locationIdParamSchema = z.object({
  locationId: z.string(),
});

const productVariantSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
});

const productLocationSchema = z.object({
  productId: z.string(),
  locationId: z.string(),
});

const locationQuerySchema = z.object({
  variantId: z.string().optional(),
});

const totalQuerySchema = z.object({
  variantId: z.string().optional(),
});

const locationsQuerySchema = z.object({
  variantId: z.string().optional(),
  minQuantity: z.string().optional(),
});

const stockCheckSchema = z.object({
  productId: z.string(),
  locationId: z.string(),
  quantity: z.number(),
  variantId: z.string().optional(),
});

const movementsQuerySchema = z.object({
  productId: z.string().optional(),
  locationId: z.string().optional(),
  type: z
    .enum(["in", "out", "adjustment", "transfer", "return"])
    .optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const stockIdSchema = z.object({
  id: z.string(),
});

const upsertStockSchema = z.object({
  productId: z.string(),
  locationId: z.string(),
  quantity: z.number(),
  variantId: z.string().optional(),
  condition: z.enum(["new", "used", "refurbished"]).optional(),
  costPrice: z.number().optional(),
  reorderLevel: z.number().optional(),
  reorderQuantity: z.number().optional(),
  supplierId: z.string().optional(),
  batchNumber: z.string().optional(),
});

const updateQuantitySchema = z.object({
  quantity: z.number(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  performedBy: z.string().optional(),
});

const recordMovementSchema = z.object({
  productStockId: z.string(),
  productId: z.string(),
  locationId: z.string(),
  type: z.enum(["in", "out", "adjustment", "transfer", "return"]),
  quantity: z.number(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  performedBy: z.string().optional(),
});

const receiveSchema = z.object({
  productStockId: z.string(),
  productId: z.string(),
  locationId: z.string(),
  quantity: z.number(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  performedBy: z.string().optional(),
});

const issueSchema = z.object({
  productStockId: z.string(),
  productId: z.string(),
  locationId: z.string(),
  quantity: z.number(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  performedBy: z.string().optional(),
});

const setCountedBalanceSchema = z.object({
  productStockId: z.string(),
  productId: z.string(),
  locationId: z.string(),
  newQuantity: z.number(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  performedBy: z.string().optional(),
});

const transferSchema = z.object({
  sourceProductStockId: z.string(),
  sourceProductId: z.string(),
  sourceLocationId: z.string(),
  destProductStockId: z.string(),
  destProductId: z.string(),
  destLocationId: z.string(),
  quantity: z.number(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  performedBy: z.string().optional(),
});

export const stockApi = new Hono<AppEnv>()
  .get("/product/:productId", validate("param", productIdSchema), async (c) => {
    const { productId } = c.req.valid("param");
    const stock = await StockService.getByProduct(productId);
    return ok(c, stock);
  })
  .get(
    "/product/:productId/variant/:variantId",
    validate("param", productVariantSchema),
    async (c) => {
      const param = c.req.valid("param");
      const stock = await StockService.getByProductAndVariant(param);
      return ok(c, stock);
    },
  )
  .get(
    "/product/:productId/location/:locationId",
    validate("param", productLocationSchema),
    validate("query", locationQuerySchema),
    async (c) => {
      const param = c.req.valid("param");
      const query = c.req.valid("query");
      const stock = await StockService.getForProductAtLocation({
        ...param,
        variantId: query.variantId,
      });

      return ok(c, stock ?? null);
    },
  )
  .get(
    "/product/:productId/total",
    validate("param", productIdSchema),
    validate("query", totalQuerySchema),
    async (c) => {
      const { productId } = c.req.valid("param");
      const { variantId } = c.req.valid("query");
      const total = await StockService.getTotalStock({
        productId,
        variantId,
      });

      return ok(c, { total });
    },
  )
  .post("/check", validate("json", stockCheckSchema), async (c) => {
    const result = await StockService.checkAvailability(c.req.valid("json"));
    return ok(c, result);
  })
  .get(
    "/product/:productId/locations",
    validate("param", productIdSchema),
    validate("query", locationsQuerySchema),
    async (c) => {
      const { productId } = c.req.valid("param");
      const query = c.req.valid("query");
      const locations = await StockService.getLocationsWithStock({
        productId,
        variantId: query.variantId,
        minQuantity: parseIntegerParam(query.minQuantity),
      });

      return ok(c, locations);
    },
  )
  .get(
    "/movements",
    requireAdmin,
    validate("query", movementsQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const movements = await StockService.getMovements({
        productId: query.productId,
        locationId: query.locationId,
        type: query.type,
        limit: parseIntegerParam(query.limit),
        offset: parseIntegerParam(query.offset),
      });
      return ok(c, movements);
    },
  )
  .get("/reorder-alerts", requireAdmin, async (c) => {
    const alerts = await StockService.getReorderAlerts();
    return ok(c, alerts);
  })
  .get(
    "/location/:locationId",
    requireAdmin,
    validate("param", locationIdParamSchema),
    async (c) => {
      const { locationId } = c.req.valid("param");
      const stock = await StockService.getByLocationEnriched(locationId);
      return ok(c, stock);
    },
  )
  .post("/", requireAdmin, validate("json", upsertStockSchema), async (c) => {
    const result = await StockService.upsert(c.req.valid("json"));
    return ok(c, result, 201);
  })
  .put(
    "/:id/quantity",
    requireAdmin,
    validate("param", stockIdSchema),
    validate("json", updateQuantitySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { quantity, reason, referenceId, performedBy } = c.req.valid("json");
      const stock = await StockService.updateQuantity({
        id,
        quantity,
        reason,
        referenceId,
        performedBy,
      });
      return ok(c, stock);
    },
  )
  .delete("/:id", requireAdmin, validate("param", stockIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const stock = await StockService.remove(id);
    return ok(c, stock);
  })
  .post(
    "/movements",
    requireAdmin,
    validate("json", recordMovementSchema),
    async (c) => {
      const movement = await StockService.recordMovement(c.req.valid("json"));
      return ok(c, movement, 201);
    },
  )
  .post("/receive", requireAdmin, validate("json", receiveSchema), async (c) => {
    const movement = await StockService.receive(c.req.valid("json"));
    return ok(c, movement, 201);
  })
  .post("/issue", requireAdmin, validate("json", issueSchema), async (c) => {
    const movement = await StockService.issue(c.req.valid("json"));
    return ok(c, movement, 201);
  })
  .post(
    "/set-counted-balance",
    requireAdmin,
    validate("json", setCountedBalanceSchema),
    async (c) => {
      const stock = await StockService.setCountedBalance(c.req.valid("json"));
      return ok(c, stock);
    },
  )
  .post("/transfer", requireAdmin, validate("json", transferSchema), async (c) => {
    const result = await StockService.transfer(c.req.valid("json"));
    return ok(c, result, 201);
  });
