import { z } from "zod";
import type {
  PaymentProvider,
  CreateCheckoutParams,
  WebhookEvent,
} from "./provider";
import { StripeProvider } from "./stripe";

export type { PaymentProvider, CreateCheckoutParams, CheckoutSession, WebhookEvent, RefundResult } from "./provider";

let providerInstance: PaymentProvider | null = null;

function getProvider(): PaymentProvider {
  if (!providerInstance) {
    const providerName = process.env.PAYMENT_PROVIDER || "stripe";
    switch (providerName) {
      case "stripe":
        providerInstance = new StripeProvider();
        break;
      default:
        throw new Error(`Unknown payment provider: ${providerName}`);
    }
  }
  return providerInstance;
}

export namespace PaymentService {
  export const CheckoutSessionInput = z
    .object({
      orderId: z.string().meta({ description: "Order ID to create checkout for" }),
      successUrl: z.string().url().meta({ description: "URL to redirect to on success" }),
      cancelUrl: z.string().url().meta({ description: "URL to redirect to on cancel" }),
    })
    .meta({ ref: "CheckoutSessionInput", description: "Input for creating a checkout session" });

  export const CheckoutSessionResult = z
    .object({
      sessionId: z.string().meta({ description: "Payment provider session ID" }),
      url: z.string().meta({ description: "Checkout redirect URL" }),
    })
    .meta({ ref: "CheckoutSessionResult", description: "Checkout session creation result" });

  export async function createCheckout(
    params: CreateCheckoutParams,
  ) {
    const provider = getProvider();
    return provider.createCheckoutSession(params);
  }

  export async function handleWebhook(
    payload: string | Buffer,
    signature: string,
  ): Promise<WebhookEvent> {
    const provider = getProvider();
    return provider.verifyWebhookEvent(payload, signature);
  }

  export async function getPaymentStatus(sessionId: string) {
    const provider = getProvider();
    return provider.getPaymentStatus(sessionId);
  }

  export async function refundPayment(paymentId: string, amount?: number) {
    const provider = getProvider();
    return provider.refund(paymentId, amount);
  }
}
