import { z } from "zod";
import { CartService } from "@repo/core/cart";
import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

// Infer types from core
export type Cart = z.infer<typeof CartService.Info>;
export type CartItem = z.infer<typeof CartService.ItemInfo>;

// Extended type for cart with items
export type CartWithItems = {
  cart: Cart;
  items: Array<
    CartItem & {
      product: unknown;
      variant: unknown | null;
    }
  >;
};

// Infer input types from core schemas
export type AddToCartInput = z.infer<typeof CartService.AddItemInput>;
export type UpdateCartItemInput = z.infer<typeof CartService.UpdateItemInput>;
export type UpdateCartItemDeliveryInput = z.infer<
  typeof CartService.UpdateItemDeliveryInput
>;

/**
 * Shopping Cart API resource
 */
export class CartResource extends APIResource {
  /**
   * Get the current user's cart with all items.
   *
   * @example
   * ```typescript
   * const cart = await client.cart.get();
   * console.log(cart.data.items);
   * ```
   */
  get(options?: RequestOptions): Promise<Response<CartWithItems>> {
    return this._client.get("/api/cart", options);
  }

  /**
   * Add an item to the cart or update quantity if it already exists.
   *
   * @param data - Item to add
   * @example
   * ```typescript
   * const cart = await client.cart.addItem({
   *   productId: 'product_123',
   *   quantity: 2
   * });
   * ```
   */
  addItem(
    data: AddToCartInput,
    options?: RequestOptions,
  ): Promise<Response<CartWithItems>> {
    return this._client.post("/api/cart/items", {
      ...options,
      body: data,
    });
  }

  /**
   * Update the quantity of a cart item.
   *
   * @param itemId - Cart item ID
   * @param data - New quantity
   */
  updateItem(
    itemId: string,
    data: UpdateCartItemInput,
    options?: RequestOptions,
  ): Promise<Response<CartWithItems>> {
    return this._client.put(`/api/cart/items/${itemId}`, {
      ...options,
      body: data,
    });
  }

  /**
   * Update the delivery method and pickup location for a cart item.
   *
   * @param itemId - Cart item ID
   * @param data - Delivery method and optional pickup location
   */
  updateItemDelivery(
    itemId: string,
    data: UpdateCartItemDeliveryInput,
    options?: RequestOptions,
  ): Promise<Response<CartWithItems>> {
    return this._client.put(`/api/cart/items/${itemId}/delivery`, {
      ...options,
      body: data,
    });
  }

  /**
   * Remove an item from the cart.
   *
   * @param itemId - Cart item ID
   */
  removeItem(
    itemId: string,
    options?: RequestOptions,
  ): Promise<Response<CartWithItems>> {
    return this._client.delete(`/api/cart/items/${itemId}`, options);
  }

  /**
   * Clear all items from the cart.
   */
  clear(options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete("/api/cart", options);
  }
}
