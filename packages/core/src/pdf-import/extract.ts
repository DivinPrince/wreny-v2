import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";

import type { CoverLetterDocument, ResumeDocument } from "../schemas";
import { mergeCoverLetterPdfExtract } from "./merge-cover-letter";
import { mergeResumePdfExtract } from "./merge-resume";
import {
  coverLetterPdfExtractSchema,
  resumePdfExtractSchema,
} from "./schemas";

const RESUME_PDF_PROMPT = `You extract resume content from the attached PDF into structured data.

Rules:
- Copy all factual text from the document; do not invent employers, dates, or degrees.
- Use markdown in summary and in experience/education summaries: bullet lines as "- point" (one bullet per line). Plain paragraphs are OK for short blurbs.
- If the PDF has no summary section, synthesize a brief professional summary from the rest (2–4 sentences) or leave summary empty if there is almost no text.
- Map LinkedIn/GitHub/website lines into profiles (network + username + icon slug like linkedin, github, or globe).
- Skills: one entry per distinct skill or skill group; put tools in keywords when listed together.
- Dates: preserve the document's date ranges as a single string (e.g. "Jan 2020 – Present").
- Omit array entries that would be completely empty.
- For unknown scalar fields use "" or [].`;

const COVER_LETTER_PDF_PROMPT = `You extract a cover letter from the attached PDF into structured fields.

Rules:
- Preserve wording; do not rewrite unless needed to fix obvious OCR issues.
- greeting: salutation line (e.g. "Dear Hiring Manager,").
- opening: first paragraph after the greeting.
- body: each main paragraph as a separate string in order (omit empty strings).
- closing: closing paragraph before the sign-off (e.g. "Thank you for your consideration.").
- signature: sign-off and name block (e.g. "Sincerely,\\nJane Doe").
- If the recipient is unknown, leave recipient fields empty.
- jobUrl must be a full URL or empty string.`;

function googleModel() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_VERTEX_API_KEY ||
    "";
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY (or GOOGLE_VERTEX_API_KEY)");
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google("gemini-2.5-flash");
}

export async function extractResumeFromPdf(
  pdfBytes: Uint8Array,
): Promise<ResumeDocument> {
  const { object } = await generateObject({
    model: googleModel(),
    schema: resumePdfExtractSchema,
    schemaName: "ResumePdfExtract",
    schemaDescription: "Structured resume fields extracted from a PDF",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: pdfBytes,
            mediaType: "application/pdf",
          },
          { type: "text", text: RESUME_PDF_PROMPT },
        ],
      },
    ],
  });

  return mergeResumePdfExtract(object);
}

export async function extractCoverLetterFromPdf(
  pdfBytes: Uint8Array,
): Promise<CoverLetterDocument> {
  const { object } = await generateObject({
    model: googleModel(),
    schema: coverLetterPdfExtractSchema,
    schemaName: "CoverLetterPdfExtract",
    schemaDescription: "Structured cover letter fields extracted from a PDF",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: pdfBytes,
            mediaType: "application/pdf",
          },
          { type: "text", text: COVER_LETTER_PDF_PROMPT },
        ],
      },
    ],
  });

  return mergeCoverLetterPdfExtract(object);
}
