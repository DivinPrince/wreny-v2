export interface CreateCheckoutParams {
  orderId: string;
  orderNumber: string;
  lineItems: Array<{
    name: string;
    image?: string;
    price: number;
    quantity: number;
  }>;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  url: string;
  paymentId?: string;
}

export interface WebhookEvent {
  type:
    | "payment.succeeded"
    | "payment.failed"
    | "refund.created"
    | "payment.ignored";
  orderId: string;
  paymentId: string;
  amount?: number;
}

export interface RefundResult {
  id: string;
  status: "succeeded" | "pending" | "failed";
  amount: number;
}

export interface PaymentProvider {
  createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutSession>;
  verifyWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Promise<WebhookEvent>;
  getPaymentStatus(
    sessionId: string,
  ): Promise<"pending" | "paid" | "failed">;
  refund(paymentId: string, amount?: number): Promise<RefundResult>;
}
