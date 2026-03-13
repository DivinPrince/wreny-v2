import { z } from "zod";

import { basicsSchema, defaultBasics } from "./basics";
import { defaultMetadata, metadataSchema } from "./metadata";
import { defaultSections, sectionsSchema } from "./sections";

// Schema
export const resumeDocumentSchema = z.object({
  basics: basicsSchema,
  sections: sectionsSchema,
  metadata: metadataSchema,
});

// Type
export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;
export type ResumeData = ResumeDocument;

// Defaults
export const defaultResumeDocument: ResumeDocument = {
  basics: defaultBasics,
  sections: defaultSections,
  metadata: defaultMetadata,
};

export const resumeDataSchema = resumeDocumentSchema;
export const defaultResumeData = defaultResumeDocument;

export * from "./basics";
export * from "./metadata";
export * from "./sample";
export * from "./sections";
export * from "./shared";
