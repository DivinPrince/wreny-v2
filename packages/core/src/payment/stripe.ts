import Stripe from "stripe";
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutSession,
  WebhookEvent,
  RefundResult,
} from "./provider";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export class StripeProvider implements PaymentProvider {
  async createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutSession> {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: params.customerEmail,
      line_items: params.lineItems.map((item) => ({
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: item.price,
          product_data: {
            name: item.name,
            ...(item.image ? { images: [item.image] } : {}),
          },
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        ...params.metadata,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return {
      id: session.id,
      url: session.url!,
      paymentId: (session.payment_intent as string) || undefined,
    };
  }

  async verifyWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Promise<WebhookEvent> {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret)
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");

    const event = await stripe.webhooks.constructEventAsync(
      typeof payload === "string" ? Buffer.from(payload) : payload,
      signature,
      secret,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentStatus =
          session.payment_status === "paid" ? "succeeded" : "failed";
        return {
          type:
            paymentStatus === "succeeded"
              ? "payment.succeeded"
              : "payment.failed",
          orderId: session.metadata?.orderId ?? "",
          paymentId: (session.payment_intent as string) ?? session.id,
          amount: session.amount_total ?? undefined,
        };
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          type: "payment.failed",
          orderId: session.metadata?.orderId ?? "",
          paymentId: (session.payment_intent as string) ?? session.id,
        };
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: charge.payment_intent as string,
          limit: 1,
        });
        const orderId = sessionList.data[0]?.metadata?.orderId ?? "";
        return {
          type: "refund.created",
          orderId,
          paymentId: charge.payment_intent as string,
          amount: charge.amount_refunded,
        };
      }
      default:
        return {
          type: "payment.ignored",
          orderId: "",
          paymentId: "",
        };
    }
  }

  async getPaymentStatus(
    sessionId: string,
  ): Promise<"pending" | "paid" | "failed"> {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    switch (session.payment_status) {
      case "paid":
        return "paid";
      case "unpaid":
        return session.status === "expired" ? "failed" : "pending";
      case "no_payment_required":
        return "paid";
      default:
        return "pending";
    }
  }

  async refund(paymentId: string, amount?: number): Promise<RefundResult> {
    const stripe = getStripe();

    const refund = await stripe.refunds.create({
      payment_intent: paymentId,
      ...(amount ? { amount } : {}),
    });

    let status: RefundResult["status"];
    switch (refund.status) {
      case "succeeded":
        status = "succeeded";
        break;
      case "pending":
        status = "pending";
        break;
      default:
        status = "failed";
    }

    return {
      id: refund.id,
      status,
      amount: refund.amount,
    };
  }
}
