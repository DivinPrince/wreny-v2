import { z } from "zod";

import { basicsSchema, defaultBasics } from "./basics";
import { defaultMetadata, metadataSchema } from "./metadata";
import { defaultSections, sectionsSchema } from "./sections";
import { aichanges } from "./aichanges";
// Schema
export const resumeDataSchema = z.object({
  basics: basicsSchema,
  sections: sectionsSchema,
  metadata: metadataSchema,
  aiChanges: aichanges.optional(),
});

// Type
export type ResumeData = z.infer<typeof resumeDataSchema>;

// Defaults
export const defaultResumeData: ResumeData = {
  basics: defaultBasics,
  sections: defaultSections,
  metadata: defaultMetadata
};

export * from "./basics";
export * from "./metadata";
export * from "./sample";
export * from "./sections";
export * from "./shared";
export * from "./aichanges";

// Usage
export * from './usage';
