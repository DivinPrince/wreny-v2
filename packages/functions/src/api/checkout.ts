import { OrderService } from "@repo/core/order";
import { PaymentService } from "@repo/core/payment";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  type AppEnv,
  assertOwnerOrAdmin,
  notFound,
  ok,
  requireAuth,
  validate,
} from "./common";

export const checkoutApi = new Hono<AppEnv>()
  .post("/webhook", async (c) => {
    const signature = c.req.header("stripe-signature");
    if (!signature) {
      throw new HTTPException(400, {
        message: "Missing stripe-signature header",
      });
    }

    const payload = Buffer.from(await c.req.arrayBuffer());
    const event = await PaymentService.handleWebhook(payload, signature);

    if (event.type !== "payment.ignored" && !event.orderId) {
      return ok(c, {
        received: true,
        eventType: event.type,
        ignored: true,
      });
    }

    switch (event.type) {
      case "payment.succeeded":
        await OrderService.updatePaymentStatus({
          id: event.orderId,
          paymentStatus: "paid",
        });
        break;
      case "payment.failed":
        await OrderService.updatePaymentStatus({
          id: event.orderId,
          paymentStatus: "failed",
        });
        break;
      case "refund.created":
        await OrderService.updatePaymentStatus({
          id: event.orderId,
          paymentStatus: "refunded",
        });
        break;
      case "payment.ignored":
        break;
    }

    return ok(c, {
      received: true,
      eventType: event.type,
    });
  })
  .use("*", requireAuth)
  .post(
    "/session",
    validate("json", PaymentService.CheckoutSessionInput),
    async (c) => {
      const { orderId, successUrl, cancelUrl } = c.req.valid("json");
      const order = await OrderService.byId(orderId);
      if (!order) {
        throw notFound("Order", orderId);
      }

      assertOwnerOrAdmin(order.userId);

      const items = await OrderService.getItems(order.id);
      const session = await PaymentService.createCheckout({
        orderId: order.id,
        orderNumber: order.orderNumber,
        currency: order.currency,
        customerEmail: order.email,
        successUrl,
        cancelUrl,
        lineItems: items.map((item) => ({
          name: item.name,
          image: item.image ?? undefined,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      await OrderService.updatePaymentReferences({
        id: order.id,
        paymentSessionId: session.id,
        paymentIntentId: session.paymentId ?? null,
      });

      return ok(c, {
        sessionId: session.id,
        url: session.url,
      });
    },
  );
