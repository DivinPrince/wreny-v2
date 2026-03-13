import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * @repo/env – Shared environment (t3-env)
 * Server + client in one. Use env.DATABASE_URL on server, env.VITE_API_URL on client.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    DRIZZLE_LOG: z.string().default("false").transform((v) => v === "true"),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    FRONTEND_URL: z.url().default("http://localhost:5000"),
    ADMIN_URL: z.url().default("http://localhost:5002"),
    API_URL: z.url().default("http://localhost:3000"),
    API_PORT: z.coerce.number().default(5001),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("1000 Hills <noreply@1000hills.rw>"),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    PAYMENT_PROVIDER: z.enum(["stripe", "paypal"]).default("stripe"),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
    AXIOM_API_TOKEN: z.string(),
    AXIOM_DATASET: z.string(),
    OTEL_SERVICE_NAME: z.string(),
    SEED_ADMIN_EMAIL: z.email().optional(),
    SEED_ADMIN_PASSWORD: z.string().optional(),
    SEED_SHOPPER_EMAIL: z.email().optional(),
    SEED_SHOPPER_PASSWORD: z.string().optional(),
    ADMIN_EMAIL: z.email().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    ADMIN_NAME: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_API_URL: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
