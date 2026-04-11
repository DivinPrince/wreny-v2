import { z } from "zod";

import { idSchema } from "../shared/id";

/** Default icon for new basics custom fields (Material Design Icons via Iconify, same resolution as profiles). */
export const defaultCustomFieldIcon = "mdi:link-variant" as const;

export const customFieldSchema = z.object({
  id: idSchema,
  icon: z
    .string()
    .describe(
      'Iconify icon (same as profiles): bare simple-icons slug like "github", or full id like "mdi:link-variant".',
    ),
  name: z.string(),
  value: z.string(),
});

export type CustomField = z.infer<typeof customFieldSchema>;
