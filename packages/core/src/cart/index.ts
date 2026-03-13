import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import { cartTable, cartItemTable } from "./cart.sql";
import { productTable, productVariantTable } from "../product/product.sql";
import { locationTable } from "../location/location.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./cart.sql";

export namespace CartService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Cart ID" }),
      userId: z.string().meta({ description: "User ID" }),
      addressId: z
        .string()
        .nullable()
        .meta({ description: "Shipping address ID" }),
      couponCode: z
        .string()
        .nullable()
        .meta({ description: "Applied coupon code" }),
      shippingMethod: z
        .string()
        .nullable()
        .meta({ description: "Selected shipping method" }),
      shippingAmount: z
        .number()
        .nullable()
        .meta({ description: "Shipping cost" }),
      notes: z.string().nullable().meta({ description: "Order notes" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "Cart", description: "Shopping cart" });

  export const ItemInfo = z
    .object({
      id: z.string().meta({ description: "Cart item ID" }),
      cartId: z.string().meta({ description: "Cart ID" }),
      productId: z.string().meta({ description: "Product ID" }),
      productVariantId: z
        .string()
        .nullable()
        .meta({ description: "Product variant ID" }),
      quantity: z.number().meta({ description: "Quantity" }),
      deliveryMethod: z
        .enum(["pickup", "delivery"])
        .meta({ description: "Delivery method" }),
      pickupLocationId: z
        .string()
        .nullable()
        .meta({
          description: "Pickup location ID (if delivery method is pickup)",
        }),
    })
    .meta({ ref: "CartItem", description: "Item in cart" });

  export const ItemWithLocation = ItemInfo.extend({
    pickupLocation: z
      .object({
        id: z.string(),
        name: z.string(),
        address: z.string().nullable(),
      })
      .nullable()
      .meta({ description: "Pickup location details" }),
  }).meta({
    ref: "CartItemWithLocation",
    description: "Cart item with pickup location details",
  });

  export const AddItemInput = z.object({
    userId: z.string(),
    productId: z.string(),
    productVariantId: z.string().optional(),
    quantity: z.number().min(1).default(1),
    deliveryMethod: z.enum(["pickup", "delivery"]).default("delivery"),
    pickupLocationId: z.string().optional(),
  });

  export const UpdateItemInput = z.object({
    cartItemId: z.string(),
    quantity: z.number().min(0),
  });

  export const UpdateItemDeliveryInput = z.object({
    cartItemId: z.string(),
    deliveryMethod: z.enum(["pickup", "delivery"]),
    pickupLocationId: z.string().optional(),
  });

  export const getOrCreate = fn(z.string(), async (userId) => {
    return withTransaction(async (tx) => {
      let [cart] = await tx
        .select()
        .from(cartTable)
        .where(eq(cartTable.userId, userId));

      if (!cart) {
        const id = createID("cart");
        [cart] = await tx.insert(cartTable).values({ id, userId }).returning();
      }

      return cart;
    });
  });

  export const getByUser = fn(z.string(), async (userId) => {
    return withTransaction(async (tx) => {
      const [cart] = await tx
        .select()
        .from(cartTable)
        .where(eq(cartTable.userId, userId));
      return cart;
    });
  });

  export const getItems = fn(z.string(), async (cartId) => {
    return withTransaction(async (tx) => {
      return tx
        .select({
          item: cartItemTable,
          product: productTable,
          variant: productVariantTable,
        })
        .from(cartItemTable)
        .innerJoin(productTable, eq(cartItemTable.productId, productTable.id))
        .leftJoin(
          productVariantTable,
          eq(cartItemTable.productVariantId, productVariantTable.id),
        )
        .where(eq(cartItemTable.cartId, cartId));
    });
  });

  export const getItemsWithDetails = fn(z.string(), async (userId) => {
    return withTransaction(async () => {
      const cart = await getOrCreate(userId);
      const items = await getItems(cart!.id);

      return {
        cart,
        items: items.map((row) => ({
          ...row.item,
          product: row.product,
          variant: row.variant,
        })),
      };
    });
  });

  export const addItem = fn(AddItemInput, async (input) => {
    return withTransaction(async (tx) => {
      const cart = await getOrCreate(input.userId);

      // Check if item already exists in cart (same product, variant, delivery method, and location)
      const conditions = [
        eq(cartItemTable.cartId, cart!.id),
        eq(cartItemTable.productId, input.productId),
        eq(cartItemTable.deliveryMethod, input.deliveryMethod),
      ];

      if (input.productVariantId) {
        conditions.push(
          eq(cartItemTable.productVariantId, input.productVariantId),
        );
      }

      if (input.pickupLocationId) {
        conditions.push(
          eq(cartItemTable.pickupLocationId, input.pickupLocationId),
        );
      }

      const [existing] = await tx
        .select()
        .from(cartItemTable)
        .where(and(...conditions));

      if (existing) {
        // Update quantity
        const [updated] = await tx
          .update(cartItemTable)
          .set({ quantity: existing.quantity + input.quantity })
          .where(eq(cartItemTable.id, existing.id))
          .returning();
        return updated;
      }

      // Create new item
      const id = createID("cart_item");
      const [item] = await tx
        .insert(cartItemTable)
        .values({
          id,
          cartId: cart!.id,
          productId: input.productId,
          productVariantId: input.productVariantId,
          quantity: input.quantity,
          deliveryMethod: input.deliveryMethod,
          pickupLocationId: input.pickupLocationId,
        })
        .returning();
      return item;
    });
  });

  export const updateItem = fn(UpdateItemInput, async (input) => {
    return withTransaction(async (tx) => {
      if (input.quantity === 0) {
        // Remove item
        await tx
          .delete(cartItemTable)
          .where(eq(cartItemTable.id, input.cartItemId));
        return null;
      }

      const [item] = await tx
        .update(cartItemTable)
        .set({ quantity: input.quantity })
        .where(eq(cartItemTable.id, input.cartItemId))
        .returning();

      if (!item) throw new NotFoundError("Cart item", input.cartItemId);
      return item;
    });
  });

  export const removeItem = fn(z.string(), async (cartItemId) => {
    return withTransaction(async (tx) => {
      const [item] = await tx
        .delete(cartItemTable)
        .where(eq(cartItemTable.id, cartItemId))
        .returning();
      if (!item) throw new NotFoundError("Cart item", cartItemId);
      return item;
    });
  });

  export const clear = fn(z.string(), async (userId) => {
    return withTransaction(async (tx) => {
      const [cart] = await tx
        .select()
        .from(cartTable)
        .where(eq(cartTable.userId, userId));

      if (cart) {
        await tx.delete(cartItemTable).where(eq(cartItemTable.cartId, cart.id));
      }
    });
  });

  export const updateCart = fn(
    z.object({
      userId: z.string(),
      addressId: z.string().optional(),
      couponCode: z.string().optional(),
      shippingMethod: z.string().optional(),
      shippingAmount: z.number().optional(),
      notes: z.string().optional(),
    }),
    async (input) => {
      const { userId, ...data } = input;
      return withTransaction(async (tx) => {
        const cart = await getOrCreate(userId);
        const [updated] = await tx
          .update(cartTable)
          .set(data)
          .where(eq(cartTable.id, cart!.id))
          .returning();
        return updated;
      });
    },
  );

  export const updateItemDelivery = fn(
    UpdateItemDeliveryInput,
    async (input) => {
      return withTransaction(async (tx) => {
        const [item] = await tx
          .update(cartItemTable)
          .set({
            deliveryMethod: input.deliveryMethod,
            pickupLocationId:
              input.deliveryMethod === "pickup" ? input.pickupLocationId : null,
          })
          .where(eq(cartItemTable.id, input.cartItemId))
          .returning();

        if (!item) throw new NotFoundError("Cart item", input.cartItemId);
        return item;
      });
    },
  );

  export const getItemsWithLocations = fn(z.string(), async (cartId) => {
    return withTransaction(async (tx) => {
      return tx
        .select({
          item: cartItemTable,
          product: productTable,
          variant: productVariantTable,
          pickupLocation: {
            id: locationTable.id,
            name: locationTable.name,
            address: locationTable.address,
          },
        })
        .from(cartItemTable)
        .innerJoin(productTable, eq(cartItemTable.productId, productTable.id))
        .leftJoin(
          productVariantTable,
          eq(cartItemTable.productVariantId, productVariantTable.id),
        )
        .leftJoin(
          locationTable,
          eq(cartItemTable.pickupLocationId, locationTable.id),
        )
        .where(eq(cartItemTable.cartId, cartId));
    });
  });

  export const getItemsWithDetailsAndLocations = fn(
    z.string(),
    async (userId) => {
      return withTransaction(async () => {
        const cart = await getOrCreate(userId);
        const items = await getItemsWithLocations(cart!.id);

        return {
          cart,
          items: items.map((row) => ({
            ...row.item,
            product: row.product,
            variant: row.variant,
            pickupLocation: row.pickupLocation?.id ? row.pickupLocation : null,
          })),
        };
      });
    },
  );
}
