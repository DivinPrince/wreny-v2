import { generateObject } from "ai";
import { z } from "zod";

import { getResumeAiModel } from "./ai-model";

export const importedDocumentKindSchema = z.object({
  kind: z.enum(["resume", "coverLetter"]),
});

export type ImportedDocumentKind = z.infer<
  typeof importedDocumentKindSchema
>["kind"];

const CLASSIFY_PROMPT = `Classify this PDF for a job-search product.

- resume: CV / résumé — work history, education, skills, certifications in sectioned layout; may include a headline.
- coverLetter: letter to a hiring manager or company — salutation (e.g. Dear …), paragraphs about interest in a role, closing and signature block.

If the document mixes both, choose the dominant purpose. If unclear, prefer resume when there are multiple jobs/dates listed, otherwise coverLetter.`;

/** Single multimodal call: PDF bytes → resume vs cover letter (for unified import routing). */
export async function classifyImportedDocumentKindFromPdf(
  pdfBytes: Uint8Array,
): Promise<ImportedDocumentKind> {
  const { object } = await generateObject({
    model: getResumeAiModel(),
    schema: importedDocumentKindSchema,
    schemaName: "ImportedDocumentKind",
    schemaDescription: "Whether the PDF is primarily a resume or a cover letter",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: pdfBytes,
            mediaType: "application/pdf",
          },
          { type: "text", text: CLASSIFY_PROMPT },
        ],
      },
    ],
  });

  return object.kind;
}
