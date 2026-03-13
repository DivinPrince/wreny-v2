import { pgTable, varchar, text, integer, unique } from "drizzle-orm/pg-core";
import { id, timestamps, ulid, dollar } from "../drizzle/types";
import { userTable } from "../user/user.sql";
import { addressTable } from "../address/address.sql";
import { productTable, productVariantTable } from "../product/product.sql";
import { locationTable } from "../location/location.sql";

export type DeliveryMethod = "pickup" | "delivery";

export const cartTable = pgTable("cart", {
  ...id,
  userId: ulid("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" })
    .unique(),
  addressId: ulid("address_id").references(() => addressTable.id, {
    onDelete: "set null",
  }),
  couponCode: varchar("coupon_code", { length: 50 }),
  shippingMethod: varchar("shipping_method", { length: 50 }),
  shippingAmount: dollar("shipping_amount"),
  notes: text("notes"),
  ...timestamps,
});

export const cartItemTable = pgTable(
  "cart_item",
  {
    ...id,
    cartId: ulid("cart_id")
      .notNull()
      .references(() => cartTable.id, { onDelete: "cascade" }),
    productId: ulid("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    productVariantId: ulid("product_variant_id").references(
      () => productVariantTable.id,
      { onDelete: "cascade" },
    ),
    quantity: integer("quantity").notNull().default(1),
    deliveryMethod: varchar("delivery_method", { length: 20 })
      .$type<DeliveryMethod>()
      .notNull()
      .default("delivery"),
    pickupLocationId: ulid("pickup_location_id").references(
      () => locationTable.id,
      { onDelete: "set null" }
    ),
    ...timestamps,
  },
  (table) => ({
    uniqueCartProduct: unique("cart_item_unique").on(
      table.cartId,
      table.productId,
      table.productVariantId,
    ),
  }),
);

export type Cart = typeof cartTable.$inferSelect;
export type NewCart = typeof cartTable.$inferInsert;
export type CartItem = typeof cartItemTable.$inferSelect;
export type NewCartItem = typeof cartItemTable.$inferInsert;
