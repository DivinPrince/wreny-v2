import { mediaBucket } from "./bucket";
import { allSecrets } from "./secret";

export const bus = new sst.aws.Bus("Bus");

bus.subscribe("Event", {
  handler: "./packages/functions/src/event/index.handler",
  link: [mediaBucket, ...allSecrets],
  timeout: "5 minutes",
});

export const outputs = {
  bus: bus.name,
};
