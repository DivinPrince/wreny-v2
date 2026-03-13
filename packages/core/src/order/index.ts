import "../../sst-env.d.ts";
import { eq, and, desc, SQL, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { afterTx, createTransaction, withTransaction } from "../drizzle/transaction";
import {
  orderTable,
  orderItemTable,
} from "./order.sql";
import { locationTable } from "../location/location.sql";
import { StockService } from "../stock";
import { fn } from "../util/fn";
import { ValidationError } from "../error";
import { createID, generateULID } from "../util/id";
import { NotFoundError } from "../error";
import { defineEvent } from "../event";
import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import type { event } from "sst/event";

export * from "./order.sql";

async function publishEvent<T extends event.Definition>(
  definition: T,
  properties: T["$input"],
) {
  await bus.publish(Resource.Bus, definition, properties);
}

export namespace OrderService {
  export const Event = {
    StatusUpdated: defineEvent(
      "order.status_updated",
      z.object({
        orderId: z.string(),
        status: z.enum([
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ]),
      }),
    ),
    PaymentStatusUpdated: defineEvent(
      "order.payment_status_updated",
      z.object({
        orderId: z.string(),
        paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
      }),
    ),
  };

  export const AddressSnapshotSchema = z
    .object({
      firstName: z.string().meta({ description: "First name" }),
      lastName: z.string().meta({ description: "Last name" }),
      company: z.string().optional().meta({ description: "Company name" }),
      street1: z.string().meta({ description: "Street address line 1" }),
      street2: z
        .string()
        .optional()
        .meta({ description: "Street address line 2" }),
      city: z.string().meta({ description: "City" }),
      state: z.string().optional().meta({ description: "State/Province" }),
      postalCode: z.string().optional().meta({ description: "Postal code" }),
      country: z.string().meta({ description: "Country" }),
      phone: z.string().optional().meta({ description: "Phone number" }),
    })
    .meta({
      ref: "AddressSnapshot",
      description: "Address snapshot at time of order",
    });

  export const Info = z
    .object({
      id: z.string().meta({ description: "Order ID" }),
      orderNumber: z
        .string()
        .meta({ description: "Human-readable order number" }),
      userId: z.string().nullable().meta({ description: "User ID" }),
      email: z.string().meta({ description: "Customer email" }),
      status: z
        .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
        .meta({ description: "Order status" }),
      paymentStatus: z
        .enum(["pending", "paid", "failed", "refunded"])
        .meta({ description: "Payment status" }),
      paymentMethod: z
        .enum(["check", "cod", "paypal", "stripe"])
        .nullable()
        .meta({ description: "Payment method" }),
      subtotal: z
        .number()
        .meta({ description: "Subtotal before shipping/tax" }),
      shippingAmount: z.number().meta({ description: "Shipping cost" }),
      discountAmount: z
        .number()
        .nullable()
        .meta({ description: "Discount amount" }),
      taxAmount: z.number().nullable().meta({ description: "Tax amount" }),
      total: z.number().meta({ description: "Total amount" }),
      currency: z.string().meta({ description: "Currency code" }),
      shippingAddress: AddressSnapshotSchema.meta({
        description: "Shipping address",
      }),
      billingAddress: AddressSnapshotSchema.nullable().meta({
        description: "Billing address",
      }),
      couponCode: z
        .string()
        .nullable()
        .meta({ description: "Applied coupon code" }),
      notes: z.string().nullable().meta({ description: "Order notes" }),
      trackingNumber: z
        .string()
        .nullable()
        .meta({ description: "Shipping tracking number" }),
      trackingUrl: z
        .string()
        .nullable()
        .meta({ description: "Tracking URL" }),
      shippedAt: z.date().nullable().meta({ description: "Shipped date" }),
      deliveredAt: z
        .date()
        .nullable()
        .meta({ description: "Delivered date" }),
      paymentSessionId: z
        .string()
        .nullable()
        .meta({ description: "Payment provider session ID" }),
      paymentIntentId: z
        .string()
        .nullable()
        .meta({ description: "Payment provider payment reference ID" }),
      pickupPersonName: z
        .string()
        .nullable()
        .meta({ description: "Pickup person name" }),
      pickupPersonPhone: z
        .string()
        .nullable()
        .meta({ description: "Pickup person phone" }),
      createdAt: z.date().meta({ description: "Order created date" }),
      updatedAt: z.date().meta({ description: "Order last updated" }),
    })
    .meta({ ref: "Order", description: "Customer order" });

  export const ItemInfo = z
    .object({
      id: z.string().meta({ description: "Order item ID" }),
      orderId: z.string().meta({ description: "Order ID" }),
      productId: z.string().nullable().meta({ description: "Product ID" }),
      productVariantId: z
        .string()
        .nullable()
        .meta({ description: "Product variant ID" }),
      name: z
        .string()
        .meta({ description: "Product name at time of order" }),
      sku: z.string().nullable().meta({ description: "SKU" }),
      image: z
        .string()
        .nullable()
        .meta({ description: "Product image URL" }),
      price: z.number().meta({ description: "Unit price" }),
      quantity: z.number().meta({ description: "Quantity ordered" }),
      total: z.number().meta({ description: "Line total" }),
      deliveryMethod: z
        .enum(["pickup", "delivery"])
        .meta({ description: "Delivery method" }),
      pickupLocationId: z
        .string()
        .nullable()
        .meta({ description: "Pickup location ID" }),
      createdAt: z.date().meta({ description: "Created date" }),
    })
    .meta({ ref: "OrderItem", description: "Item in an order" });

  export const ItemWithLocation = ItemInfo.extend({
    pickupLocation: z
      .object({
        id: z.string(),
        name: z.string(),
        address: z.string().nullable(),
        city: z.string().nullable(),
      })
      .nullable()
      .meta({ description: "Pickup location details" }),
  }).meta({
    ref: "OrderItemWithLocation",
    description: "Order item with pickup location",
  });

  export const WithItems = Info.extend({
    items: z.array(ItemInfo).meta({ description: "Order items" }),
  }).meta({ ref: "OrderWithItems", description: "Order with line items" });

  export const CreateInput = z.object({
    userId: z.string().optional(),
    email: z.string().email(),
    paymentMethod: z.enum(["check", "cod", "paypal", "stripe"]),
    shippingAddress: z.object({
      firstName: z.string(),
      lastName: z.string(),
      company: z.string().optional(),
      street1: z.string(),
      street2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string(),
      phone: z.string().optional(),
    }),
    billingAddress: z
      .object({
        firstName: z.string(),
        lastName: z.string(),
        company: z.string().optional(),
        street1: z.string(),
        street2: z.string().optional(),
        city: z.string(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string(),
        phone: z.string().optional(),
      })
      .optional(),
    items: z.array(
      z.object({
        productId: z.string(),
        productVariantId: z.string().optional(),
        name: z.string(),
        sku: z.string().optional(),
        image: z.string().optional(),
        price: z.number(),
        quantity: z.number().min(1),
        deliveryMethod: z.enum(["pickup", "delivery"]).default("delivery"),
        pickupLocationId: z.string().optional(),
      }),
    ),
    subtotal: z.number(),
    shippingAmount: z.number(),
    discountAmount: z.number().optional(),
    taxAmount: z.number().optional(),
    total: z.number(),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
    pickupPersonName: z.string().optional(),
    pickupPersonPhone: z.string().optional(),
  });

  export const ListInput = z.object({
    userId: z.string().optional(),
    status: z
      .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
      .optional(),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
  });

  function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = generateULID().slice(-4).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const id = createID("order");
      const orderNumber = generateOrderNumber();

      const [order] = await tx
        .insert(orderTable)
        .values({
          id,
          orderNumber,
          userId: input.userId,
          email: input.email,
          paymentMethod: input.paymentMethod,
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress,
          subtotal: input.subtotal,
          shippingAmount: input.shippingAmount,
          discountAmount: input.discountAmount,
          taxAmount: input.taxAmount,
          total: input.total,
          couponCode: input.couponCode,
          notes: input.notes,
          pickupPersonName: input.pickupPersonName,
          pickupPersonPhone: input.pickupPersonPhone,
        })
        .returning();

      // Create order items
      for (const item of input.items) {
        const itemId = createID("order_item");
        await tx.insert(orderItemTable).values({
          id: itemId,
          orderId: order!.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          name: item.name,
          sku: item.sku,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          deliveryMethod: item.deliveryMethod,
          pickupLocationId: item.pickupLocationId,
        });
      }

      return order;
    });
  });

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orderTable)
        .where(eq(orderTable.id, id));
      return order;
    });
  });

  export const byOrderNumber = fn(z.string(), async (orderNumber) => {
    return withTransaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orderTable)
        .where(eq(orderTable.orderNumber, orderNumber));
      return order;
    });
  });

  export const getItems = fn(z.string(), async (orderId) => {
    return withTransaction(async (tx) => {
      return tx
        .select()
        .from(orderItemTable)
        .where(eq(orderItemTable.orderId, orderId));
    });
  });

  export const getItemsWithLocations = fn(z.string(), async (orderId) => {
    return withTransaction(async (tx) => {
      return tx
        .select({
          ...getTableColumns(orderItemTable),
          pickupLocationName: locationTable.name,
        })
        .from(orderItemTable)
        .leftJoin(
          locationTable,
          eq(orderItemTable.pickupLocationId, locationTable.id),
        )
        .where(eq(orderItemTable.orderId, orderId));
    });
  });

  export const list = fn(ListInput.optional(), async (input) => {
    return withTransaction(async (tx) => {
      const conditions: SQL<unknown>[] = [];

      if (input?.userId) {
        conditions.push(eq(orderTable.userId, input.userId));
      }
      if (input?.status) {
        conditions.push(eq(orderTable.status, input.status));
      }

      let query = tx
        .select()
        .from(orderTable)
        .orderBy(desc(orderTable.createdAt));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
      if (input?.limit) {
        query = query.limit(input.limit) as typeof query;
      }
      if (input?.offset) {
        query = query.offset(input.offset) as typeof query;
      }

      return query;
    });
  });

  export const updateStatus = fn(
    z.object({
      id: z.string(),
      status: z.enum([
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ]),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const updates: Partial<typeof orderTable.$inferInsert> = {
          status: input.status,
        };

        if (input.status === "shipped") {
          updates.shippedAt = new Date();
        } else if (input.status === "delivered") {
          updates.deliveredAt = new Date();
        }

        const [order] = await tx
          .update(orderTable)
          .set(updates)
          .where(eq(orderTable.id, input.id))
          .returning();

        if (!order) throw new NotFoundError("Order", input.id);

        await afterTx(() =>
          publishEvent(Event.StatusUpdated, {
            orderId: order.id,
            status: order.status,
          }),
        );

        return order;
      });
    },
  );

  export const updatePaymentStatus = fn(
    z.object({
      id: z.string(),
      paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
    }),
    async (input) => {
      const order = await withTransaction(async (tx) => {
        const [ord] = await tx
          .update(orderTable)
          .set({ paymentStatus: input.paymentStatus })
          .where(eq(orderTable.id, input.id))
          .returning();

        if (!ord) throw new NotFoundError("Order", input.id);

        await afterTx(() =>
          publishEvent(Event.PaymentStatusUpdated, {
            orderId: ord.id,
            paymentStatus: ord.paymentStatus,
          }),
        );

        return ord;
      });

      if (input.paymentStatus === "paid") {
        await issueStockForOrder(input.id);
      }

      return order;
    },
  );

  export const updateTracking = fn(
    z.object({
      id: z.string(),
      trackingNumber: z.string(),
      trackingUrl: z.string().optional(),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const [order] = await tx
          .update(orderTable)
          .set({
            trackingNumber: input.trackingNumber,
            trackingUrl: input.trackingUrl,
          })
          .where(eq(orderTable.id, input.id))
          .returning();

        if (!order) throw new NotFoundError("Order", input.id);
        return order;
      });
    },
  );

  export const updatePaymentReferences = fn(
    z.object({
      id: z.string(),
      paymentSessionId: z.string().nullable().optional(),
      paymentIntentId: z.string().nullable().optional(),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const updates: Partial<typeof orderTable.$inferInsert> = {};
        if (input.paymentSessionId !== undefined) {
          updates.paymentSessionId = input.paymentSessionId;
        }
        if (input.paymentIntentId !== undefined) {
          updates.paymentIntentId = input.paymentIntentId;
        }

        const [order] = await tx
          .update(orderTable)
          .set(updates)
          .where(eq(orderTable.id, input.id))
          .returning();

        if (!order) throw new NotFoundError("Order", input.id);
        return order;
      });
    },
  );

  /**
   * Issues stock for each order item when payment is confirmed.
   * Idempotent: no-op if stock was already issued for this order.
   * Call from Stripe webhook (payment.succeeded) and when admin sets payment-status to paid.
   */
  export const issueStockForOrder = fn(z.string(), async (orderId) => {
    return createTransaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orderTable)
        .where(eq(orderTable.id, orderId));

      if (!order) throw new NotFoundError("Order", orderId);
      if (order.paymentStatus !== "paid") return;
      if (order.stockIssuedAt) return;

      const items = await tx
        .select()
        .from(orderItemTable)
        .where(eq(orderItemTable.orderId, orderId));

      for (const item of items) {
        if (!item.productId) continue;

        let locationId: string;
        if (item.deliveryMethod === "pickup" && item.pickupLocationId) {
          locationId = item.pickupLocationId;
        } else {
          const locations = await StockService.getLocationsWithStock({
            productId: item.productId,
            variantId: item.productVariantId ?? undefined,
            minQuantity: item.quantity,
          });
          const first = locations[0];
          if (!first) {
            throw new ValidationError(
              `Insufficient stock for ${item.name}: no location has ${item.quantity} unit(s) available`,
            );
          }
          locationId = first.locationId;
        }

        const stock = await StockService.getForProductAtLocation({
          productId: item.productId,
          locationId,
          variantId: item.productVariantId ?? undefined,
        });

        if (!stock) {
          throw new ValidationError(
            `No stock record for ${item.name} at the selected location`,
          );
        }

        await StockService.issue({
          productStockId: stock.id,
          productId: item.productId,
          locationId,
          quantity: item.quantity,
          reason: "Order fulfilled",
          referenceId: orderId,
        });
      }

      await tx
        .update(orderTable)
        .set({ stockIssuedAt: new Date() })
        .where(eq(orderTable.id, orderId));
    });
  });
}
