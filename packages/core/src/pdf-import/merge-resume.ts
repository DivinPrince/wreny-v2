import { z } from "zod";

import {
  defaultResumeDocument,
  type ResumeDocument,
} from "../schemas/resume";
import { defaultUrl } from "../schemas/resume/shared";
import type { ResumePdfExtract } from "./schemas";

function newItemId(): string {
  return crypto.randomUUID();
}

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

/** Merge Gemini extract into a full ResumeDocument (defaults + stable ids). */
export function mergeResumePdfExtract(extracted: ResumePdfExtract): ResumeDocument {
  const doc = structuredClone(defaultResumeDocument);

  const b = extracted.basics;
  doc.basics.name = b.name.trim();
  doc.basics.headline = b.headline.trim();
  doc.basics.email = normalizeEmail(b.email);
  doc.basics.phone = b.phone.trim();
  doc.basics.location = b.location.trim();
  if (b.personalUrl) {
    doc.basics.url = {
      label: b.personalUrl.label.trim(),
      href: normalizeUrlHref(b.personalUrl.href),
    };
  }

  doc.sections.summary.content = extracted.summary.trim();

  doc.sections.experience.items = extracted.experience
    .filter((e) => e.company.trim() || e.position.trim())
    .map((e) => ({
      id: newItemId(),
      visible: true,
      company: e.company.trim() || "—",
      position: e.position.trim(),
      location: e.location.trim(),
      date: e.date.trim(),
      summary: e.summary.trim(),
      url: e.url
        ? {
            label: e.url.label.trim(),
            href: normalizeUrlHref(e.url.href),
          }
        : { ...defaultUrl },
    }));

  doc.sections.education.items = extracted.education
    .filter((ed) => ed.institution.trim())
    .map((ed) => ({
      id: newItemId(),
      visible: true,
      institution: ed.institution.trim(),
      studyType: ed.studyType.trim(),
      area: ed.area.trim(),
      score: ed.score.trim(),
      date: ed.date.trim(),
      summary: ed.summary.trim(),
      url: ed.url
        ? {
            label: ed.url.label.trim(),
            href: normalizeUrlHref(ed.url.href),
          }
        : { ...defaultUrl },
    }));

  doc.sections.skills.items = extracted.skills
    .filter((s) => s.name.trim())
    .map((s) => ({
      id: newItemId(),
      visible: true,
      name: s.name.trim(),
      description: s.description.trim(),
      level: s.level,
      keywords: s.keywords.map((k) => k.trim()).filter(Boolean),
    }));

  doc.sections.profiles.items = extracted.profiles
    .filter((p) => p.network.trim() && p.username.trim())
    .map((p) => ({
      id: newItemId(),
      visible: true,
      network: p.network.trim(),
      username: p.username.trim(),
      icon: p.icon.trim(),
      url: p.url
        ? {
            label: p.url.label.trim(),
            href: normalizeUrlHref(p.url.href),
          }
        : { ...defaultUrl },
    }));

  doc.sections.projects.items = extracted.projects
    .filter((p) => p.name.trim())
    .map((p) => ({
      id: newItemId(),
      visible: true,
      name: p.name.trim(),
      description: p.description.trim(),
      date: p.date.trim(),
      summary: p.summary.trim(),
      keywords: p.keywords.map((k) => k.trim()).filter(Boolean),
      url: p.url
        ? {
            label: p.url.label.trim(),
            href: normalizeUrlHref(p.url.href),
          }
        : { ...defaultUrl },
    }));

  doc.sections.certifications.items = extracted.certifications
    .filter((c) => c.name.trim())
    .map((c) => ({
      id: newItemId(),
      visible: true,
      name: c.name.trim(),
      issuer: c.issuer.trim(),
      date: c.date.trim(),
      summary: c.summary.trim(),
      url: c.url
        ? {
            label: c.url.label.trim(),
            href: normalizeUrlHref(c.url.href),
          }
        : { ...defaultUrl },
    }));

  return doc;
}
