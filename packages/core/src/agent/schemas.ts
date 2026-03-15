import { z } from "zod";

export const documentChangeOperationSchema = z.enum([
  "replace",
  "delete-item",
  "set-section-visible",
]);

export const documentChangeSchema = z.object({
  id: z.string().describe("Unique change identifier"),
  operation: documentChangeOperationSchema
    .default("replace")
    .describe(
      'Type of change. Use "replace" for normal text edits, "delete-item" to remove a list item from a resume section, and "set-section-visible" to show or hide a whole resume section.',
    ),
  section: z
    .string()
    .describe(
      'Top-level section key. For resumes: "basics", "summary", "experience", "education", "skills", "projects", "awards", "certifications", "volunteer", "interests", "languages", "profiles", "publications", "references". For cover letters: "sender", "recipient", "context", "content".',
    ),
  itemId: z
    .string()
    .optional()
    .describe(
      "Item ID within an array section (e.g. a specific experience entry). Omit for scalar sections like summary or basics.",
    ),
  field: z
    .string()
    .describe(
      'Field within the section or item to change (e.g. "summary", "headline", "position", "content", "opening", "keywords", "url.href"). Nested fields can use dot notation. For "delete-item", use "__item__". For "set-section-visible", use "visible".',
    ),
  original: z
    .string()
    .describe(
      'Current value being changed. For "delete-item", use a short human-readable label for the item being removed. For "set-section-visible", use "true" or "false".',
    ),
  proposed: z
    .string()
    .describe(
      'Proposed replacement value. For "delete-item", use an empty string. For "set-section-visible", use "true" or "false".',
    ),
  reason: z
    .string()
    .describe("Brief explanation of why this change improves the document"),
});

export const changeProposalSchema = z.object({
  documentType: z.enum(["resume", "coverLetter"]),
  documentId: z.string().describe("ID of the resume or cover letter to modify"),
  changes: z
    .array(documentChangeSchema)
    .min(1)
    .describe("List of proposed changes"),
  summary: z
    .string()
    .describe("Brief overall summary of what these changes accomplish"),
});

export type DocumentChange = z.infer<typeof documentChangeSchema>;
export type ChangeProposal = z.infer<typeof changeProposalSchema>;
