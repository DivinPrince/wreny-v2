import { z } from "zod";

import {
  defaultCoverLetterDocument,
  type CoverLetterDocument,
} from "../schemas/cover-letter";
import { defaultUrl } from "../schemas/resume/shared";
import type { CoverLetterPdfExtract } from "./schemas";

function normalizeEmail(raw: string): "" | string {
  const t = raw.trim();
  if (!t) return "";
  const r = z.string().email().safeParse(t);
  return r.success ? t : "";
}

function normalizeUrlHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Merge Gemini extract into a full CoverLetterDocument. */
export function mergeCoverLetterPdfExtract(
  extracted: CoverLetterPdfExtract,
): CoverLetterDocument {
  const doc = structuredClone(defaultCoverLetterDocument);

  doc.sender.name = extracted.sender.name.trim();
  doc.sender.email = normalizeEmail(extracted.sender.email);
  doc.sender.phone = extracted.sender.phone.trim();
  doc.sender.location = extracted.sender.location.trim();
  doc.sender.title = extracted.sender.title.trim();
  if (extracted.sender.url) {
    doc.sender.url = {
      label: extracted.sender.url.label.trim(),
      href: normalizeUrlHref(extracted.sender.url.href),
    };
  } else {
    doc.sender.url = { ...defaultUrl };
  }

  doc.recipient.name = extracted.recipient.name.trim();
  doc.recipient.title = extracted.recipient.title.trim();
  doc.recipient.companyName = extracted.recipient.companyName.trim();
  doc.recipient.location = extracted.recipient.location.trim();
  doc.recipient.email = normalizeEmail(extracted.recipient.email);

  doc.context.jobTitle = extracted.context.jobTitle.trim();
  doc.context.companyName = extracted.context.companyName.trim();
  const ju = extracted.context.jobUrl.trim();
  const withScheme =
    ju && !/^https?:\/\//i.test(ju) ? `https://${ju}` : ju;
  doc.context.jobUrl =
    withScheme && z.string().url().safeParse(withScheme).success
      ? withScheme
      : "";
  doc.context.tone = extracted.context.tone;

  doc.content.greeting = extracted.content.greeting.trim();
  doc.content.opening = extracted.content.opening.trim();
  doc.content.body = extracted.content.body.map((p) => p.trim()).filter(Boolean);
  doc.content.closing = extracted.content.closing.trim();
  doc.content.signature = extracted.content.signature.trim();

  return doc;
}
