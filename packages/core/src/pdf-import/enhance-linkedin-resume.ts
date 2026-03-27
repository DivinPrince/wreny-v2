import { generateObject } from "ai";
import { z } from "zod";

import type { ResumeDocument } from "../schemas/resume";
import { getResumeAiModel } from "./ai-model";

const MAX_PROFILE_JSON_CHARS = 120_000;

const linkedInEnhancementSchema = z.object({
  professionalSummary: z
    .string()
    .describe(
      "Resume summary section: 2–4 tight sentences about the candidate. Present tense or neutral professional voice.",
    ),
  experienceSummaries: z
    .array(z.string())
    .describe(
      "One entry per experience row in input order. Markdown bullet lines starting with '- ' when multiple points; empty string if the role has no substantive detail to expand.",
    ),
});

const LINKEDIN_ENHANCE_PROMPT = `You polish a resume that was imported from LinkedIn scrape data.

Hard rules (non-negotiable):
- Use ONLY facts supported by PROFILE_JSON and RESUME_SNAPSHOT. Do not invent employers, job titles, dates, degrees, certifications, metrics, revenue, team sizes, or tools that are not clearly implied by the source.
- If the source is thin, write fewer, simpler bullets—never fabricate impact.
- Preserve company names, job titles, and date strings exactly as given in RESUME_SNAPSHOT (you may rephrase bullet body text, not headings).

Best practices:
- Professional summary: highlight current focus from headline + strongest verified themes (roles, domains, skills). Avoid generic filler unless it matches the profile.
- Experience bullets: strong verbs; 2–5 bullets when the source has enough detail; 0–1 short bullets when the source is nearly empty; use "- " for each bullet line; combine skills/locations from PROFILE_JSON only when they clearly belong to that role.

Output format:
- professionalSummary: plain text, 2–4 sentences separated by spaces (no markdown headings).
- experienceSummaries: array of strings, SAME LENGTH as experiences in RESUME_SNAPSHOT, same order. Each string is either empty or uses markdown lines starting with "- ".`;

function buildResumeSnapshot(document: ResumeDocument): string {
  const exp = document.sections.experience.items.map((e) => ({
    company: e.company,
    position: e.position,
    date: e.date,
    location: e.location,
    currentSummary: e.summary,
  }));
  return JSON.stringify(
    {
      basics: {
        name: document.basics.name,
        headline: document.basics.headline,
        location: document.basics.location,
        email: document.basics.email,
      },
      summarySection: document.sections.summary.content,
      experiences: exp,
    },
    null,
    2,
  );
}

function alignExperienceSummaries(
  summaries: string[],
  targetLen: number,
): string[] {
  const out = summaries.slice(0, targetLen);
  while (out.length < targetLen) {
    out.push("");
  }
  return out;
}

/**
 * Rewrites summary + experience bullets using Gemini, grounded in scrape JSON + merged resume.
 * On any failure, callers should fall back to the input document.
 */
export async function enhanceLinkedInImportedResume(
  document: ResumeDocument,
  profileItems: unknown[],
): Promise<ResumeDocument> {
  const expCount = document.sections.experience.items.length;
  const profileJson = JSON.stringify(profileItems).slice(0, MAX_PROFILE_JSON_CHARS);
  const resumeSnapshot = buildResumeSnapshot(document);

  const { object } = await generateObject({
    model: getResumeAiModel(),
    schema: linkedInEnhancementSchema,
    schemaName: "LinkedInResumeEnhancement",
    schemaDescription:
      "Improved professional summary and per-role bullet summaries grounded in LinkedIn data",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${LINKEDIN_ENHANCE_PROMPT}

There are exactly ${expCount} experience rows. experienceSummaries must have exactly ${expCount} strings.

PROFILE_JSON:
${profileJson}

RESUME_SNAPSHOT:
${resumeSnapshot}`,
          },
        ],
      },
    ],
  });

  const next = structuredClone(document);
  next.sections.summary.content = object.professionalSummary.trim();

  const aligned = alignExperienceSummaries(
    object.experienceSummaries,
    expCount,
  );
  for (let i = 0; i < expCount; i++) {
    const item = next.sections.experience.items[i];
    if (item) {
      item.summary = aligned[i]!.trim();
    }
  }

  return next;
}
