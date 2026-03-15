import { streamHandle } from "hono/aws-lambda";
import { app, apiRoutes } from "./api/app";

export type Routes = typeof apiRoutes;
export { app };

export const handler = streamHandle(app);
