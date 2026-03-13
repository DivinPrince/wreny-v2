import { Actor } from "@repo/core/actor";
import { CartService } from "@repo/core/cart";
import { Hono } from "hono";
import { z } from "zod";
import {
  type AppEnv,
  notFound,
  ok,
  requireAuth,
  success,
  validate,
} from "./common";

const cartItemIdSchema = z.object({
  itemId: z.string(),
});

const addItemSchema = CartService.AddItemInput.omit({
  userId: true,
});

const updateItemSchema = z.object({
  quantity: z.number().min(0),
});

const updateDeliverySchema = z.object({
  deliveryMethod: z.enum(["pickup", "delivery"]),
  pickupLocationId: z.string().optional(),
});

async function getCartState(userId: string) {
  return CartService.getItemsWithDetailsAndLocations(userId);
}

async function assertCartItemOwned(userId: string, itemId: string) {
  const cart = await getCartState(userId);
  const item = cart.items.find((entry) => entry.id === itemId);
  if (!item) {
    throw notFound("Cart item", itemId);
  }
}

export const cartApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const cart = await getCartState(Actor.userID());
    return ok(c, cart);
  })
  .post("/items", validate("json", addItemSchema), async (c) => {
    const userId = Actor.userID();
    await CartService.addItem({
      userId,
      ...c.req.valid("json"),
    });

    return ok(c, await getCartState(userId));
  })
  .put(
    "/items/:itemId",
    validate("param", cartItemIdSchema),
    validate("json", updateItemSchema),
    async (c) => {
      const userId = Actor.userID();
      const { itemId } = c.req.valid("param");
      await assertCartItemOwned(userId, itemId);

      await CartService.updateItem({
        cartItemId: itemId,
        quantity: c.req.valid("json").quantity,
      });

      return ok(c, await getCartState(userId));
    },
  )
  .put(
    "/items/:itemId/delivery",
    validate("param", cartItemIdSchema),
    validate("json", updateDeliverySchema),
    async (c) => {
      const userId = Actor.userID();
      const { itemId } = c.req.valid("param");
      await assertCartItemOwned(userId, itemId);

      await CartService.updateItemDelivery({
        cartItemId: itemId,
        ...c.req.valid("json"),
      });

      return ok(c, await getCartState(userId));
    },
  )
  .delete("/items/:itemId", validate("param", cartItemIdSchema), async (c) => {
    const userId = Actor.userID();
    const { itemId } = c.req.valid("param");
    await assertCartItemOwned(userId, itemId);

    await CartService.removeItem(itemId);
    return ok(c, await getCartState(userId));
  })
  .delete("/", async (c) => {
    await CartService.clear(Actor.userID());
    return success(c);
  });
