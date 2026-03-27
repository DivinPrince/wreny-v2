import type { ResumeDocument } from "../schemas/resume";
import { mergeResumePdfExtract } from "./merge-resume";
import { resumePdfExtractSchema, type ResumePdfExtract } from "./schemas";

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function pickStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function linkedInUsernameFromUrl(url: string): string {
  const m = url.trim().match(/linkedin\.com\/in\/([^/?#]+)/i);
  const slug = m?.[1];
  return slug ? decodeURIComponent(slug) : "";
}

/** Multi-paragraph LinkedIn “about” → summary text (preserve paragraph breaks). */
function aboutToSummary(text: string): string {
  return text
    .trim()
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Role description: newline-separated lines → markdown bullets when multiple lines. */
function roleDescriptionToMarkdown(text: string): string {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  if (lines.length === 1) return lines[0]!;
  return lines
    .map((l) => {
      if (l.startsWith("-") || l.startsWith("•")) {
        return l.startsWith("•") ? `- ${l.slice(1).trim()}` : l;
      }
      return `- ${l}`;
    })
    .join("\n");
}

function eduDateRange(o: Record<string, unknown>): string {
  const dr = pickStr(o.date_range);
  if (dr) return dr;
  const sy = pickStr(o.start_year);
  const ey = pickStr(o.end_year);
  const sm = pickStr(o.start_month);
  const em = pickStr(o.end_month);
  if (!sy && !ey) return "";
  if (sy && ey) return `${sm || ""} ${sy} – ${em || ""} ${ey}`.trim();
  return sy || ey;
}

/** Prefer API `location`; otherwise join city / state / country without duplicating “Kigali City” twice. */
function buildProfileLocation(d: Record<string, unknown>): string {
  const direct = pickStr(d.location).trim();
  if (direct) return direct;

  const city = pickStr(d.city).trim();
  const state = pickStr(d.state).trim();
  const country = pickStr(d.country).trim();
  const parts: string[] = [];
  const push = (s: string) => {
    if (!s) return;
    if (!parts.includes(s)) parts.push(s);
  };
  push(city);
  if (state && state !== city) push(state);
  if (country) push(country);
  return parts.join(", ");
}

/**
 * LinkedIn experience: free-text description plus optional `skills` line
 * ("Skills: A · B · C"). Omit employer marketing copy — only role fields.
 */
function experienceSummary(o: Record<string, unknown>): string {
  const desc = pickStr(o.description);
  const skillsRaw = pickStr(o.skills);
  const blocks: string[] = [];

  if (desc) {
    blocks.push(roleDescriptionToMarkdown(desc));
  }

  if (skillsRaw) {
    const stripped = skillsRaw.replace(/^\s*skills\s*:\s*/i, "").trim();
    if (stripped) {
      const pieces = stripped
        .split(/[·|]/u)
        .map((s) => s.trim())
        .filter(Boolean);
      if (pieces.length > 0) {
        blocks.push(
          pieces.length === 1
            ? pieces[0]!
            : pieces.map((p) => (p.startsWith("-") ? p : `- ${p}`)).join("\n"),
        );
      }
    }
  }

  return blocks.join("\n\n");
}

function normalizeHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Prefer company site (`company_website` on role or profile for current employer); else LinkedIn. */
function experienceLinkHref(
  o: Record<string, unknown>,
  profile: Record<string, unknown>,
): string | undefined {
  const roleSite = pickStr(o.company_website).trim();
  if (roleSite) return normalizeHref(roleSite);

  const roleCo = pickStr(o.company).trim().toLowerCase();
  const profileCo = pickStr(profile.company).trim().toLowerCase();
  const profileSite = pickStr(profile.company_website).trim();
  if (roleCo && profileCo && roleCo === profileCo && profileSite) {
    return normalizeHref(profileSite);
  }

  const li =
    pickStr(o.company_linkedin_url) || pickStr(o.company_public_url);
  return li ? normalizeHref(li) : undefined;
}

function parseExperiences(
  raw: unknown,
  profile: Record<string, unknown>,
): ResumePdfExtract["experience"] {
  if (!Array.isArray(raw)) return [];
  const out: ResumePdfExtract["experience"] = [];
  for (const e of raw) {
    const o = asRecord(e);
    if (!o) continue;
    const company = pickStr(o.company);
    const position = pickStr(o.title);
    if (!company && !position) continue;
    const href = experienceLinkHref(o, profile);
    out.push({
      company: company || "—",
      position,
      location: pickStr(o.location),
      date: pickStr(o.date_range) || pickStr(o.duration),
      summary: experienceSummary(o),
      url: href ? { label: "", href } : undefined,
    });
  }
  return out;
}

function parseEducations(raw: unknown): ResumePdfExtract["education"] {
  if (!Array.isArray(raw)) return [];
  const out: ResumePdfExtract["education"] = [];
  for (const ed of raw) {
    const o = asRecord(ed);
    if (!o) continue;
    const institution = pickStr(o.school);
    if (!institution) continue;
    const href = pickStr(o.school_linkedin_url);
    const degree = pickStr(o.degree);
    const field = pickStr(o.field_of_study);
    out.push({
      institution,
      studyType: degree || field,
      area: degree ? field : "",
      score: "",
      date: eduDateRange(o),
      summary: pickStr(o.activities),
      url: href ? { label: "", href } : undefined,
    });
  }
  return out;
}

function parseSkills(raw: unknown): ResumePdfExtract["skills"] {
  const s = pickStr(raw);
  if (!s) return [];
  return s
    .split(/[|·]/u)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      description: "",
      level: 1 as const,
      keywords: [] as string[],
    }));
}

/** Webhook / scraper `languages` array: strings or `{ name | language | title }`. */
function parseLanguageSkills(raw: unknown): ResumePdfExtract["skills"] {
  if (!Array.isArray(raw)) return [];
  const out: ResumePdfExtract["skills"] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) {
        out.push({
          name,
          description: "",
          level: 1 as const,
          keywords: [] as string[],
        });
      }
      continue;
    }
    const o = asRecord(item);
    if (!o) continue;
    const name =
      pickStr(o.name) ||
      pickStr(o.language) ||
      pickStr(o.title) ||
      pickStr(o.proficiency);
    if (!name.trim()) continue;
    out.push({
      name: name.trim(),
      description: "",
      level: 1 as const,
      keywords: [] as string[],
    });
  }
  return out;
}

function mergeSkillLists(
  a: ResumePdfExtract["skills"],
  b: ResumePdfExtract["skills"],
): ResumePdfExtract["skills"] {
  const seen = new Set(a.map((s) => s.name.trim().toLowerCase()));
  const merged = [...a];
  for (const s of b) {
    const k = s.name.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    merged.push(s);
  }
  return merged;
}

function parseCertifications(raw: unknown): ResumePdfExtract["certifications"] {
  if (!Array.isArray(raw)) return [];
  const out: ResumePdfExtract["certifications"] = [];
  for (const c of raw) {
    const o = asRecord(c);
    if (!o) continue;
    const name = pickStr(o.name) || pickStr(o.title);
    if (!name) continue;
    const certUrl = pickStr(o.url);
    out.push({
      name,
      issuer: pickStr(o.authority) || pickStr(o.issuer),
      date:
        pickStr(o.issued) ||
        pickStr(o.date) ||
        pickStr(o.date_range),
      summary: pickStr(o.summary) || pickStr(o.description),
      url: certUrl ? { label: "", href: certUrl } : undefined,
    });
  }
  return out;
}

function looksLikeLinkedInProfilePayload(d: Record<string, unknown>): boolean {
  return (
    typeof d.full_name === "string" ||
    typeof d.headline === "string" ||
    Array.isArray(d.experiences) ||
    Array.isArray(d.educations)
  );
}

/**
 * Unwrap one import row: webhook JSON (`{ data: { …profile } }` or flat object).
 */
function profileRecordFromImportItem(item: unknown): Record<string, unknown> | null {
  const rec = asRecord(item);
  if (!rec) return null;
  const nested = asRecord(rec.data);
  if (nested && looksLikeLinkedInProfilePayload(nested)) {
    return nested;
  }
  if (looksLikeLinkedInProfilePayload(rec)) {
    return rec;
  }
  return null;
}

/** Profile summary: About section, else headline — not employer `company_description`. */
function profileSummaryText(d: Record<string, unknown>): string {
  const about = pickStr(d.about);
  if (about) return aboutToSummary(about);
  const headline = pickStr(d.headline);
  if (headline) return headline;
  return "";
}

function linkedInProfilePayloadToExtract(d: Record<string, unknown>): ResumePdfExtract {
  const fullName =
    pickStr(d.full_name) ||
    [pickStr(d.first_name), pickStr(d.last_name)].filter(Boolean).join(" ").trim();
  const headline =
    pickStr(d.headline).trim() || pickStr(d.job_title).trim();
  const email = pickStr(d.email);
  const phone = pickStr(d.phone);
  const location = buildProfileLocation(d);
  const linkedIn = pickStr(d.linkedin_url);
  const personalUrl = linkedIn ? { label: "", href: linkedIn } : undefined;
  const pictureUrl = pickStr(d.profile_image_url).trim() || undefined;
  const username =
    pickStr(d.public_id) || (linkedIn ? linkedInUsernameFromUrl(linkedIn) : "");

  const profiles: ResumePdfExtract["profiles"] = [];
  if (linkedIn) {
    profiles.push({
      network: "LinkedIn",
      username: username || "profile",
      icon: "linkedin",
      url: { label: "", href: linkedIn },
    });
  }

  const raw: ResumePdfExtract = {
    basics: {
      name: fullName,
      headline,
      email,
      phone,
      location,
      ...(pictureUrl ? { pictureUrl } : {}),
      personalUrl,
    },
    summary: profileSummaryText(d),
    experience: parseExperiences(d.experiences, d),
    education: parseEducations(d.educations),
    skills: mergeSkillLists(parseSkills(d.skills), parseLanguageSkills(d.languages)),
    profiles,
    projects: [],
    certifications: parseCertifications(d.certifications),
  };

  return resumePdfExtractSchema.parse(raw);
}

/**
 * If import rows match the common LinkedIn profile JSON shape (`data` wrapper or flat),
 * merge into a resume without calling the LLM.
 */
export function tryMergeLinkedInProfileItems(
  items: unknown[],
): ResumeDocument | null {
  for (const item of items) {
    const payload = profileRecordFromImportItem(item);
    if (!payload) continue;
    try {
      const extracted = linkedInProfilePayloadToExtract(payload);
      const hasContent =
        extracted.basics.name.trim() !== "" ||
        extracted.experience.length > 0 ||
        extracted.summary.trim() !== "" ||
        extracted.basics.headline.trim() !== "";
      if (!hasContent) continue;
      return mergeResumePdfExtract(extracted);
    } catch {
      continue;
    }
  }
  return null;
}
