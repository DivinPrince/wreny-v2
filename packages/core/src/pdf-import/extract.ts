import { generateObject } from "ai";

import type { CoverLetterDocument, ResumeDocument } from "../schemas";
import { getResumeAiModel } from "./ai-model";
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

export async function extractResumeFromPdf(
  pdfBytes: Uint8Array,
): Promise<ResumeDocument> {
  const { object } = await generateObject({
    model: getResumeAiModel(),
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
    model: getResumeAiModel(),
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

const LINKEDIN_SCRAPER_PROMPT = `You convert LinkedIn profile data from a third-party scraper (JSON below) into the same structured resume fields we use for PDF extraction.

Rules:
- Use only information present in the JSON; do not invent employers, dates, degrees, or contact details.
- Map headline to basics.headline; map full name to basics.name; location fields to basics.location; public profile URL to basics.personalUrl and to profiles (network "LinkedIn", icon "linkedin").
- Experience: each role → company, position/title, location, date range as one string, summary with markdown bullets "- point" when the source lists bullets.
- Education, skills, certifications, projects: map when the JSON includes them; omit empty array entries.
- Email/phone: only if explicitly in the JSON.
- If the payload is empty or unusable, return mostly empty strings and arrays.`;

/** Normalize LinkedIn profile import JSON (webhook payload rows) into a full resume document. */
export async function extractResumeFromLinkedInScraperItems(
  items: unknown[],
): Promise<ResumeDocument> {
  const payload =
    items.length === 0
      ? "[]"
      : JSON.stringify(items).slice(0, 450_000);

  const { object } = await generateObject({
    model: getResumeAiModel(),
    schema: resumePdfExtractSchema,
    schemaName: "ResumePdfExtract",
    schemaDescription: "Structured resume fields from LinkedIn scraper JSON",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${LINKEDIN_SCRAPER_PROMPT}\n\nJSON:\n${payload}`,
          },
        ],
      },
    ],
  });

  return mergeResumePdfExtract(object);
}
