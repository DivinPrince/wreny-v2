import { nanoid } from "nanoid";
import { z } from "zod";

export const idSchema = z
  .string()
  .default(nanoid())
  .describe("Unique identifier for the item in Cuid2 format");
