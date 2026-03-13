import { pgTable, varchar, text, integer, jsonb } from "drizzle-orm/pg-core";
import { id, timestamps, ulid, dollar, timestamp } from "../drizzle/types";
import { userTable } from "../user/user.sql";
import { productTable, productVariantTable } from "../product/product.sql";
import { locationTable } from "../location/location.sql";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "check" | "cod" | "paypal" | "stripe";
export type DeliveryMethod = "pickup" | "delivery";

export interface AddressSnapshot {
  firstName: string;
  lastName: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export const orderTable = pgTable("order", {
  ...id,
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  userId: ulid("user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 })
    .$type<OrderStatus>()
    .default("pending")
    .notNull(),
  paymentStatus: varchar("payment_status", { length: 50 })
    .$type<PaymentStatus>()
    .default("pending")
    .notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).$type<PaymentMethod>(),
  subtotal: dollar("subtotal").notNull(),
  shippingAmount: dollar("shipping_amount").notNull().default(0),
  discountAmount: dollar("discount_amount").default(0),
  taxAmount: dollar("tax_amount").default(0),
  total: dollar("total").notNull(),
  currency: varchar("currency", { length: 3 }).default("RWF").notNull(),
  shippingAddress: jsonb("shipping_address").$type<AddressSnapshot>().notNull(),
  billingAddress: jsonb("billing_address").$type<AddressSnapshot>(),
  couponCode: varchar("coupon_code", { length: 50 }),
  notes: text("notes"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  trackingUrl: text("tracking_url"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  paymentSessionId: varchar("payment_session_id", { length: 255 }),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  pickupPersonName: varchar("pickup_person_name", { length: 255 }),
  pickupPersonPhone: varchar("pickup_person_phone", { length: 50 }),
  stockIssuedAt: timestamp("stock_issued_at"),
  ...timestamps,
});

export const orderItemTable = pgTable("order_item", {
  ...id,
  orderId: ulid("order_id")
    .notNull()
    .references(() => orderTable.id, { onDelete: "cascade" }),
  productId: ulid("product_id").references(() => productTable.id, {
    onDelete: "set null",
  }),
  productVariantId: ulid("product_variant_id").references(
    () => productVariantTable.id,
    { onDelete: "set null" },
  ),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  image: text("image"),
  price: dollar("price").notNull(),
  quantity: integer("quantity").notNull(),
  total: dollar("total").notNull(),
  deliveryMethod: varchar("delivery_method", { length: 20 })
    .$type<DeliveryMethod>()
    .notNull()
    .default("delivery"),
  pickupLocationId: ulid("pickup_location_id").references(
    () => locationTable.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Order = typeof orderTable.$inferSelect;
export type NewOrder = typeof orderTable.$inferInsert;
export type OrderItem = typeof orderItemTable.$inferSelect;
export type NewOrderItem = typeof orderItemTable.$inferInsert;
