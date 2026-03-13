import { Actor } from "@repo/core/actor";
import { AddressService } from "@repo/core/address";
import { OrderService } from "@repo/core/order";
import { Hono } from "hono";
import { z } from "zod";
import {
  type AppEnv,
  assertOwnerOrAdmin,
  notFound,
  ok,
  paginated,
  parseIntegerParam,
  requireAdmin,
  requireAuth,
  validate,
} from "./common";
import { ErrorCodes, VisibleError } from "@repo/core/error";

const orderIdSchema = z.object({
  id: z.string(),
});

const orderListQuerySchema = z.object({
  status: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const createOrderSchema = OrderService.CreateInput.extend({
  saveAddress: z.boolean().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
});

const updateTrackingSchema = z.object({
  trackingNumber: z.string(),
  trackingUrl: z.string().optional(),
});

async function withItems(order: Awaited<ReturnType<typeof OrderService.byId>>) {
  if (!order) {
    return null;
  }

  const items = await OrderService.getItems(order.id);
  return {
    ...order,
    items,
  };
}

async function getOwnedOrder(orderId: string) {
  const order = await OrderService.byId(orderId);
  if (!order) {
    throw notFound("Order", orderId);
  }

  assertOwnerOrAdmin(order.userId);
  return order;
}

export const ordersApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", validate("query", orderListQuerySchema), async (c) => {
    const actor = Actor.assert("user");

    const query = c.req.valid("query");
    const limit = parseIntegerParam(query.limit);
    const offset = parseIntegerParam(query.offset);
    const baseInput = {
      userId: actor.properties.userID,
      status: query.status,
    };

    const total = (await OrderService.list(baseInput)).length;
    const orders = await OrderService.list({
      ...baseInput,
      limit,
      offset,
    });
    const hydrated = await Promise.all(orders.map((order) => withItems(order)));

    return paginated(
      c,
      hydrated.filter((order): order is NonNullable<typeof order> => Boolean(order)),
      {
        total,
        limit: limit ?? total,
        offset: offset ?? 0,
        hasMore: (offset ?? 0) + orders.length < total,
      },
    );
  })
  .get("/:id", validate("param", orderIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const order = await getOwnedOrder(id);
    return ok(c, await withItems(order));
  })
  .post("/", validate("json", createOrderSchema), async (c) => {
    const actor = Actor.current();
    const body = c.req.valid("json");
    const order = await OrderService.create({
      ...body,
      userId: actor.type === "user" ? actor.properties.userID : body.userId,
    });

    if (actor.type === "user" && body.saveAddress) {
      await AddressService.create({
        userId: actor.properties.userID,
        type: "shipping",
        firstName: body.shippingAddress.firstName,
        lastName: body.shippingAddress.lastName,
        company: body.shippingAddress.company,
        street1: body.shippingAddress.street1,
        street2: body.shippingAddress.street2,
        city: body.shippingAddress.city,
        state: body.shippingAddress.state,
        postalCode: body.shippingAddress.postalCode,
        country: body.shippingAddress.country,
        phone: body.shippingAddress.phone,
      });
    }

    return ok(c, await withItems(order), 201);
  })
  .post("/:id/cancel", validate("param", orderIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const order = await getOwnedOrder(id);

    if (order.status !== "pending") {
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_STATE,
        "Only pending orders can be cancelled",
      );
    }

    const updated = await OrderService.updateStatus({
      id,
      status: "cancelled",
    });

    return ok(c, updated);
  })
  .put(
    "/:id/status",
    requireAdmin,
    validate("param", orderIdSchema),
    validate("json", updateOrderStatusSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const order = await OrderService.updateStatus({
        id,
        status: c.req.valid("json").status,
      });

      return ok(c, order);
    },
  )
  .put(
    "/:id/payment-status",
    requireAdmin,
    validate("param", orderIdSchema),
    validate("json", updatePaymentStatusSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const order = await OrderService.updatePaymentStatus({
        id,
        paymentStatus: c.req.valid("json").paymentStatus,
      });

      return ok(c, order);
    },
  )
  .put(
    "/:id/tracking",
    requireAdmin,
    validate("param", orderIdSchema),
    validate("json", updateTrackingSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const payload = c.req.valid("json");
      const order = await OrderService.updateTracking({
        id,
        trackingNumber: payload.trackingNumber,
        trackingUrl: payload.trackingUrl,
      });

      return ok(c, order);
    },
  );
