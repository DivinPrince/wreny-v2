import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

export interface CheckoutSessionInput {
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Checkout API resource for payment session management
 */
export class CheckoutResource extends APIResource {
  /**
   * Create a checkout session for an order.
   * Returns a redirect URL to the payment provider's hosted checkout.
   *
   * @param data - Checkout session input
   * @example
   * ```typescript
   * const session = await client.checkout.createSession({
   *   orderId: 'order_123',
   *   successUrl: 'https://example.com/checkout/success',
   *   cancelUrl: 'https://example.com/checkout/cancel',
   * });
   * window.location.href = session.url;
   * ```
   */
  createSession(
    data: CheckoutSessionInput,
    options?: RequestOptions,
  ): Promise<Response<CheckoutSessionResult>> {
    return this._client.post("/api/checkout/session", {
      ...options,
      body: data,
    });
  }
}
