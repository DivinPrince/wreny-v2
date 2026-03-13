import { Actor } from "@repo/core/actor";
import { OrderService } from "@repo/core/order";
import { bus } from "sst/aws/bus";

const events = [
  OrderService.Event.StatusUpdated,
  OrderService.Event.PaymentStatusUpdated,
];

async function provideActor<
  T extends {
    metadata: {
      actor: {
        type: "user" | "system" | "public";
        properties: Record<string, unknown>;
      };
    };
  },
>(event: T, fn: () => Promise<void>) {
  const actor = event.metadata.actor;

  if (actor.type === "user") {
    await Actor.provide(
      "user",
      {
        userID: String(actor.properties.userID),
        role: String(actor.properties.role ?? "user"),
      },
      fn,
    );
    return;
  }

  if (actor.type === "system") {
    await Actor.provide(
      "system",
      {
        userID: String(actor.properties.userID),
      },
      fn,
    );
    return;
  }

  await Actor.provide("public", {}, fn);
}

export const handler = bus.subscriber(events, async (event) =>
  provideActor(event, async () => {
    switch (event.type) {
      case OrderService.Event.StatusUpdated.type:
        console.info("order.status_updated", {
          orderId: event.properties.orderId,
          status: event.properties.status,
        });
        break;
      case OrderService.Event.PaymentStatusUpdated.type:
        console.info("order.payment_status_updated", {
          orderId: event.properties.orderId,
          paymentStatus: event.properties.paymentStatus,
        });
        break;
    }
  }),
);
