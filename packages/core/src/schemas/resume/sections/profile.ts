import { z } from "zod";

import { defaultItem, defaultUrl, itemSchema, urlSchema } from "../shared";

// Schema
export const profileSchema = itemSchema.extend({
  network: z.string().min(1),
  username: z.string().min(1),
  icon: z
    .string()
    .describe(
      'Iconify icon name. Supports bare brand slugs like "github" and "linkedin" (resolved via simple-icons), or full Iconify names like "mdi:github" or "mdi/github".',
    ),
  url: urlSchema,
});

// Type
export type Profile = z.infer<typeof profileSchema>;

// Defaults
export const defaultProfile: Profile = {
  ...defaultItem,
  network: "",
  username: "",
  icon: "",
  url: defaultUrl,
};
