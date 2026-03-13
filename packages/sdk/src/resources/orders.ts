import { z } from "zod";
import { OrderService } from "@repo/core/order";
import { APIResource } from "../core";
import type { Response, PaginatedResponse, RequestOptions } from "../types";

// Infer types from core
export type Order = z.infer<typeof OrderService.Info>;
export type OrderWithItems = z.infer<typeof OrderService.WithItems>;

// Infer input types from core schemas
export type CreateOrderInput = z.infer<typeof OrderService.CreateInput> & {
  saveAddress?: boolean;
};

export type OrderListParams = Partial<{
  status: string;
  limit: string;
  offset: string;
}>;

/**
 * Orders API resource
 */
export class OrdersResource extends APIResource {
  /**
   * List all orders for the current user with pagination.
   *
   * @param params - Query parameters
   * @example
   * ```typescript
   * const orders = await client.orders.list({
   *   status: 'delivered',
   *   limit: '10'
   * });
   * ```
   */
  list(
    params?: OrderListParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<OrderWithItems>> {
    return this._client.get("/api/orders", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  /**
   * Get a specific order by ID with all items and details.
   *
   * @param id - Order ID
   */
  get(id: string, options?: RequestOptions): Promise<Response<OrderWithItems>> {
    return this._client.get(`/api/orders/${id}`, options);
  }

  /**
   * Create a new order from the current cart or provided items.
   *
   * @param data - Order data
   * @example
   * ```typescript
   * const order = await client.orders.create({
   *   items: [
   *     { productId: 'product_123', quantity: 2, price: 29.99 }
   *   ],
   *   shippingAddressId: 'addr_123',
   *   paymentMethod: 'card'
   * });
   * ```
   */
  create(
    data: CreateOrderInput,
    options?: RequestOptions,
  ): Promise<Response<OrderWithItems>> {
    return this._client.post("/api/orders", {
      ...options,
      body: data,
    });
  }

  /**
   * Cancel an order. Only pending orders can be cancelled.
   *
   * @param id - Order ID
   */
  cancel(id: string, options?: RequestOptions): Promise<Response<Order>> {
    return this._client.post(`/api/orders/${id}/cancel`, options);
  }

  /**
   * Update order status. Requires admin access.
   *
   * @param id - Order ID
   * @param status - New order status
   * @example
   * ```typescript
   * await client.orders.updateStatus('order_123', 'shipped');
   * ```
   */
  updateStatus(
    id: string,
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled",
    options?: RequestOptions,
  ): Promise<Response<Order>> {
    return this._client.put(`/api/orders/${id}/status`, {
      ...options,
      body: { status },
    });
  }

  /**
   * Update payment status. Requires admin access.
   *
   * @param id - Order ID
   * @param paymentStatus - New payment status
   * @example
   * ```typescript
   * await client.orders.updatePaymentStatus('order_123', 'paid');
   * ```
   */
  updatePaymentStatus(
    id: string,
    paymentStatus: "pending" | "paid" | "failed" | "refunded",
    options?: RequestOptions,
  ): Promise<Response<Order>> {
    return this._client.put(`/api/orders/${id}/payment-status`, {
      ...options,
      body: { paymentStatus },
    });
  }

  /**
   * Update tracking information. Requires admin access.
   *
   * @param id - Order ID
   * @param data - Tracking information
   * @example
   * ```typescript
   * await client.orders.updateTracking('order_123', {
   *   trackingNumber: '1Z999AA10123456784',
   *   trackingUrl: 'https://tracking.example.com/...'
   * });
   * ```
   */
  updateTracking(
    id: string,
    data: { trackingNumber: string; trackingUrl?: string },
    options?: RequestOptions,
  ): Promise<Response<Order>> {
    return this._client.put(`/api/orders/${id}/tracking`, {
      ...options,
      body: data,
    });
  }
}
