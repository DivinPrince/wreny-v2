import { z } from "zod";

export const idSchema = z
  .string()
  .default(() => crypto.randomUUID())
  .describe("Unique identifier for the item in Cuid2 format");
