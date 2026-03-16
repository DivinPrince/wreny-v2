import { tool } from "ai";
import { z } from "zod";

import { CoverLetterService } from "../cover-letter";
import { JobsService } from "../jobs";
import { ResumeService } from "../resume";
import {
  defaultAward,
  defaultCertification,
  defaultCustomSection,
  defaultEducation,
  defaultExperience,
  defaultInterest,
  defaultLanguage,
  defaultLayout,
  defaultProfile,
  defaultProject,
  defaultPublication,
  defaultReference,
  defaultSkill,
  defaultUrl,
  defaultVolunteer,
} from "../schemas/resume";
import type { ResumeDocument } from "../schemas/resume";
import type { CoverLetterDocument } from "../schemas/cover-letter";
import { UserService } from "../user";
import { changeProposalSchema } from "./schemas";

export const getResume = tool({
  description:
    "Fetch a resume document by ID. Returns the full structured resume including basics, all sections (summary, experience, education, skills, projects, etc.), and metadata.",
  inputSchema: z.object({
    resumeId: z.string().describe("The resume ID to fetch"),
  }),
  execute: async ({ resumeId }) => {
    const resume = await ResumeService.byId(resumeId);
    if (!resume) return { error: "Resume not found" };
    return {
      id: resume.id,
      title: resume.title,
      data: resume.data,
    };
  },
});

export const getCoverLetter = tool({
  description:
    "Fetch a cover letter document by ID. Returns the full structured cover letter including sender, recipient, context, content (greeting, opening, body paragraphs, closing, signature), and metadata.",
  inputSchema: z.object({
    coverLetterId: z.string().describe("The cover letter ID to fetch"),
  }),
  execute: async ({ coverLetterId }) => {
    const coverLetter = await CoverLetterService.byId(coverLetterId);
    if (!coverLetter) return { error: "Cover letter not found" };
    return {
      id: coverLetter.id,
      title: coverLetter.title,
      data: coverLetter.data,
    };
  },
});

export const getJobDetails = tool({
  description:
    "Fetch job posting details by ID. Returns job title, company, description, location, salary, and any attached documents. Use this to tailor resume/cover letter content to a specific job.",
  inputSchema: z.object({
    jobId: z.string().describe("The job ID to fetch"),
  }),
  execute: async ({ jobId }) => {
    const job = await JobsService.byId(jobId);
    if (!job) return { error: "Job not found" };
    return {
      id: job.id,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      jobDescription: job.jobDescription,
      location: job.location,
      salary: job.salary,
      jobUrl: job.jobUrl,
      notes: job.notes,
    };
  },
});

export const getUserProfile = tool({
  description:
    "Fetch the current user's profile information including name, email, and phone.",
  inputSchema: z.object({
    userId: z.string().describe("The user ID to fetch profile for"),
  }),
  execute: async ({ userId }) => {
    const user = await UserService.byId(userId);
    if (!user) return { error: "User not found" };
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
    };
  },
});

export const getDocumentSchema = tool({
  description:
    "Return the full editable schema and supported operations for resumes or cover letters. Use this when you need to add a missing section/item, create content in an empty section, or you're unsure which fields exist.",
  inputSchema: z.object({
    documentType: z.enum(["resume", "coverLetter"]),
  }),
  execute: async ({ documentType }) => {
    if (documentType === "resume") {
      return {
        documentType,
        notes: [
          "All standard resume sections already exist in the schema even when they are empty or not currently shown.",
          'To add a missing standard section, add an item to that section and optionally set visible to true. The system will place the section in layout if needed.',
          'To create a custom section, use a section key like "custom.leadership" with operation "add-item". The custom section group will be created automatically.',
        ],
        basics: {
          scalarFields: ["name", "headline", "email", "phone", "location", "url.label", "url.href"],
          customFieldItemShape: {
            icon: "string",
            name: "string",
            value: "string",
          },
        },
        sections: {
          summary: { kind: "rich-text", fields: ["content"], supportsVisibility: true },
          awards: { kind: "list", itemShape: { title: "string", awarder: "string", date: "string", summary: "string", url: { label: "string", href: "string" } } },
          certifications: { kind: "list", itemShape: { name: "string", issuer: "string", date: "string", summary: "string", url: { label: "string", href: "string" } } },
          education: { kind: "list", itemShape: { institution: "string", studyType: "string", area: "string", score: "string", date: "string", summary: "string", url: { label: "string", href: "string" } } },
          experience: { kind: "list", itemShape: { company: "string", position: "string", location: "string", date: "string", summary: "string", url: { label: "string", href: "string" } } },
          volunteer: { kind: "list", itemShape: { organization: "string", position: "string", location: "string", date: "string", summary: "string", url: { label: "string", href: "string" } } },
          interests: { kind: "list", itemShape: { name: "string", keywords: ["string"] } },
          languages: { kind: "list", itemShape: { name: "string", description: "string", level: "number 0-5" } },
          profiles: { kind: "list", itemShape: { network: "string", username: "string", icon: "string", url: { label: "string", href: "string" } } },
          projects: { kind: "list", itemShape: { name: "string", description: "string", date: "string", summary: "string", keywords: ["string"], url: { label: "string", href: "string" } } },
          publications: { kind: "list", itemShape: { name: "string", publisher: "string", date: "string", summary: "string", url: { label: "string", href: "string" } } },
          references: { kind: "list", itemShape: { name: "string", description: "string", summary: "string", url: { label: "string", href: "string" } } },
          skills: { kind: "list", itemShape: { name: "string", description: "string", level: "number 0-5", keywords: ["string"] } },
          "custom.<sectionId>": {
            kind: "list",
            itemShape: {
              name: "string",
              description: "string",
              date: "string",
              location: "string",
              summary: "string",
              keywords: ["string"],
              url: { label: "string", href: "string" },
            },
          },
        },
        supportedOperations: [
          { operation: "replace", use: "Update an existing scalar field or item field" },
          { operation: "add-item", use: 'Add a new list item or basics custom field; for custom sections use a key like "custom.leadership"' },
          { operation: "delete-item", use: "Remove an existing list item" },
          { operation: "set-section-visible", use: "Show or hide a resume section" },
        ],
      };
    }

    return {
      documentType,
      notes: [
        "Cover letters always have sender, recipient, context, content, and metadata objects in the schema.",
        'To add another body paragraph, use operation "add-item" with section "content" and field "body".',
      ],
      sections: {
        sender: {
          fields: ["name", "email", "phone", "location", "title", "url.label", "url.href"],
        },
        recipient: {
          fields: ["name", "title", "companyName", "location", "email"],
        },
        context: {
          fields: ["jobTitle", "companyName", "jobUrl", "tone"],
        },
        content: {
          fields: ["greeting", "opening", "closing", "signature"],
          bodyParagraph: "string",
        },
        metadata: {
          fields: ["notes"],
        },
      },
      supportedOperations: [
        { operation: "replace", use: "Update any editable field, including nested url fields and metadata notes" },
        { operation: "add-item", use: "Add a body paragraph to content.body" },
      ],
    };
  },
});

export const proposeDocumentChanges = tool({
  description: `Propose specific text changes to a resume or cover letter. Each change targets a section/field path.

For RESUMES, valid sections and their fields:
- "basics": fields are "name", "headline", "email", "phone", "location", "url.label", "url.href"
- "basics" with itemId: targets a basics custom field; fields are "name", "value", "icon"
- "summary": field is "content" (the summary text, no itemId needed)
- "experience": requires itemId; fields are "company", "position", "location", "date", "summary"
- "education": requires itemId; fields are "institution", "studyType", "area", "score", "date", "summary"
- "skills": requires itemId; fields are "name", "description", "keywords" (comma-separated)
- "projects": requires itemId; fields are "name", "description", "date", "summary", "keywords" (comma-separated)
- "profiles": requires itemId; fields are "network", "username", "icon", "url.label", "url.href"
- "awards": requires itemId; fields are "title", "awarder", "date", "summary", "url.label", "url.href"
- "certifications": requires itemId; fields are "name", "issuer", "date", "summary", "url.label", "url.href"
- "volunteer": requires itemId; fields are "organization", "position", "location", "date", "summary", "url.label", "url.href"
- "publications": requires itemId; fields are "name", "publisher", "date", "summary", "url.label", "url.href"
- "references": requires itemId; fields are "name", "description", "summary", "url.label", "url.href"
- "languages": requires itemId; fields are "name", "description", "level"
- "interests": requires itemId; fields are "name", "keywords" (comma-separated)
- Custom sections use section keys like "custom.leadership". Their item fields are "name", "description", "date", "location", "summary", "keywords", "url.label", "url.href"

All standard resume sections already exist in the schema even if they are empty or not currently shown. If a standard section is missing from the current resume, add an item to that section and it will be shown. To create a brand-new custom section, use an "add-item" change with a section key like "custom.leadership".

For COVER LETTERS, valid sections and their fields:
- "sender": fields are "name", "email", "phone", "location", "title", "url.label", "url.href"
- "recipient": fields are "name", "title", "companyName", "location", "email"
- "context": fields are "jobTitle", "companyName", "jobUrl", "tone"
- "content": fields are "greeting", "opening", "closing", "signature", "body" (use paragraph index as itemId, e.g. "0", "1")
- "metadata": fields are "notes"

Operations:
- "replace": normal field edit. Include section, field, original, proposed, and itemId when needed.
- "add-item": add a new resume item or cover letter body paragraph. For resume sections, use field "__item__" and put the full item payload as a JSON string in proposed. For cover letter body paragraphs, use section "content", field "body", and proposed as the paragraph text. For custom resume sections, use a key like "custom.leadership".
- "delete-item": remove one resume list item entirely. Use the section, the target itemId, field "__item__", original as a short label for the item being removed, and proposed as an empty string.
- "set-section-visible": hide or show a whole resume section. Use the section, field "visible", original "true" or "false", and proposed "false" to hide or "true" to show.

Always include both the original and proposed text so the user can see the diff.

**Format for rich-text fields**: Use **markdown** only. Bullet lists: \`- item\`. Bold: \`**text**\`. Paragraphs: separate with blank lines. Never use HTML tags.
- RESUMES: summary, experience.summary, education.summary, projects.summary, etc.
- COVER LETTERS: greeting, opening, body paragraphs, closing, signature, metadata.notes`,
  inputSchema: changeProposalSchema,
  needsApproval: true,
  execute: async ({ documentType, documentId, changes }) => {
    if (documentType === "resume") {
      return applyResumeChanges(documentId, changes);
    }
    return applyCoverLetterChanges(documentId, changes);
  },
});

type Change = z.infer<typeof changeProposalSchema>["changes"][number];

type EditableRecord = Record<string, unknown>;

function isRecord(value: unknown): value is EditableRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }

  return [];
}

function mergeUrlFromPayload(
  target: EditableRecord,
  payload: EditableRecord,
) {
  if ("url" in target) {
    target.url = {
      ...defaultUrl,
      ...(isRecord(payload.url) ? payload.url : {}),
    };
  }
}

function createResumeItem(section: string, payload: EditableRecord) {
  if (section === "basics") {
    return {
      id: crypto.randomUUID(),
      icon: typeof payload.icon === "string" ? payload.icon : "link",
      name: typeof payload.name === "string" ? payload.name : "",
      value: typeof payload.value === "string" ? payload.value : "",
    };
  }

  const base =
    section === "awards"
      ? structuredClone(defaultAward)
      : section === "certifications"
        ? structuredClone(defaultCertification)
        : section === "education"
          ? structuredClone(defaultEducation)
          : section === "experience"
            ? structuredClone(defaultExperience)
            : section === "interests"
              ? structuredClone(defaultInterest)
              : section === "languages"
                ? structuredClone(defaultLanguage)
                : section === "profiles"
                  ? structuredClone(defaultProfile)
                  : section === "projects"
                    ? structuredClone(defaultProject)
                    : section === "publications"
                      ? structuredClone(defaultPublication)
                      : section === "references"
                        ? structuredClone(defaultReference)
                        : section === "skills"
                          ? structuredClone(defaultSkill)
                          : section === "volunteer"
                            ? structuredClone(defaultVolunteer)
                            : section.startsWith("custom.")
                              ? structuredClone(defaultCustomSection)
                              : undefined;

  if (!base) {
    return undefined;
  }

  const item = {
    ...base,
    ...payload,
    id: typeof payload.id === "string" && payload.id ? payload.id : crypto.randomUUID(),
    visible: typeof payload.visible === "boolean" ? payload.visible : true,
  } as EditableRecord;

  mergeUrlFromPayload(item, payload);

  if ("keywords" in item) {
    item.keywords = normalizeStringArray(payload.keywords ?? item.keywords);
  }

  if ("level" in item && typeof payload.level !== "number") {
    item.level = typeof item.level === "number" ? item.level : 1;
  }

  return item;
}

function getResumeSection(
  data: ResumeDocument,
  section: string,
) {
  if (section.startsWith("custom.")) {
    return data.sections.custom[section.slice("custom.".length)];
  }

  if (section === "custom") {
    return undefined;
  }

  return section in data.sections
    ? data.sections[section as keyof typeof data.sections]
    : undefined;
}

function parseBooleanString(value: string) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function formatSectionName(section: string) {
  const raw = section.startsWith("custom.") ? section.slice("custom.".length) : section;
  return raw
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ensureResumeSectionInLayout(
  data: ResumeDocument,
  section: string,
) {
  if (section === "basics") {
    return;
  }

  const hasSection = data.metadata.layout.some((page) =>
    page.some((column) => column.includes(section)),
  );
  if (hasSection) {
    return;
  }

  if (data.metadata.layout.length === 0) {
    data.metadata.layout = structuredClone(defaultLayout);
  }

  const firstPage = data.metadata.layout[0] ?? [];
  if (data.metadata.layout[0] == null) {
    data.metadata.layout[0] = firstPage;
  }

  let preferredColumnIndex = defaultLayout[0]?.findIndex((column) => column.includes(section)) ?? -1;
  if (preferredColumnIndex < 0) {
    preferredColumnIndex = firstPage.length > 1 ? 1 : 0;
  }

  while (firstPage.length <= preferredColumnIndex) {
    firstPage.push([]);
  }

  const targetColumn = firstPage[preferredColumnIndex];
  if (targetColumn) {
    targetColumn.push(section);
  }
}

function ensureCustomResumeSection(
  data: ResumeDocument,
  section: string,
) {
  if (!section.startsWith("custom.")) {
    return;
  }

  const customId = section.slice("custom.".length);
  if (!customId) {
    return;
  }

  if (!data.sections.custom[customId]) {
    data.sections.custom[customId] = {
      name: formatSectionName(section),
      columns: 1,
      separateLinks: true,
      visible: true,
      id: customId,
      items: [],
    };
  }
}

async function applyResumeChanges(documentId: string, changes: Change[]) {
  const resume = await ResumeService.byId(documentId);
  if (!resume) return { error: "Resume not found" };

  const data: ResumeDocument = structuredClone(resume.data);

  for (const change of changes) {
    const { operation, section, itemId, field, proposed } = change;

    if (operation === "add-item") {
      if (section === "summary") {
        data.sections.summary.content = proposed;
        data.sections.summary.visible = true;
        ensureResumeSectionInLayout(data, section);
        continue;
      }

      if (section === "basics") {
        const payload = parseJsonRecord(proposed);
        if (!payload) {
          continue;
        }

        const item = createResumeItem(section, payload);
        if (item) {
          data.basics.customFields.push(item as typeof data.basics.customFields[number]);
        }
        continue;
      }

      ensureCustomResumeSection(data, section);
      const sectionGroup = getResumeSection(data, section);
      const payload = field === "__item__" ? parseJsonRecord(proposed) : undefined;
      if (!sectionGroup || !("items" in sectionGroup) || !payload) {
        continue;
      }

      const item = createResumeItem(section, payload);
      if (!item) {
        continue;
      }

      (sectionGroup.items as Array<EditableRecord>).push(item);
      sectionGroup.visible = true;
      ensureResumeSectionInLayout(data, section);
      continue;
    }

    if (operation === "delete-item") {
      if (section === "basics" && itemId) {
        data.basics.customFields = data.basics.customFields.filter(
          (customField) => customField.id !== itemId,
        );
        continue;
      }

      const sectionGroup = getResumeSection(data, section);
      if (sectionGroup && "items" in sectionGroup && itemId) {
        const items = sectionGroup.items as Array<{ id: string }>;
        sectionGroup.items = items.filter((item) => item.id !== itemId) as typeof sectionGroup.items;
      }
      continue;
    }

    if (operation === "set-section-visible") {
      const visible = parseBooleanString(proposed);
      if (visible === undefined) {
        continue;
      }

      if (section === "summary") {
        data.sections.summary.visible = visible;
        continue;
      }

      const sectionGroup = getResumeSection(data, section);
      if (sectionGroup && "visible" in sectionGroup) {
        sectionGroup.visible = visible;
        if (visible) {
          ensureResumeSectionInLayout(data, section);
        }
      }
      continue;
    }

    if (section === "basics") {
      if (itemId) {
        const item = data.basics.customFields.find((customField) => customField.id === itemId);
        if (item) {
          setField(item as Record<string, unknown>, field, proposed);
        }
      } else {
        setField(data.basics as Record<string, unknown>, field, proposed);
      }
    } else if (section === "summary") {
      data.sections.summary.content = proposed;
    } else {
      const sec = getResumeSection(data, section);
      if (sec && itemId && "items" in sec) {
        const item = (sec.items as Array<{ id: string }>).find(
          (i) => i.id === itemId,
        );
        if (item) {
          if (field === "keywords") {
            setField(
              item as Record<string, unknown>,
              field,
              proposed.split(",").map((k: string) => k.trim()),
            );
          } else {
            setField(item as Record<string, unknown>, field, proposed);
          }
        }
      }
    }
  }

  await ResumeService.update({ id: documentId, data });
  return { success: true, appliedCount: changes.length };
}

async function applyCoverLetterChanges(
  documentId: string,
  changes: Change[],
) {
  const coverLetter = await CoverLetterService.byId(documentId);
  if (!coverLetter) return { error: "Cover letter not found" };

  const data: CoverLetterDocument = structuredClone(coverLetter.data);

  for (const change of changes) {
    const { operation, section, itemId, field, proposed } = change;

    if (operation === "add-item") {
      if (section === "content" && field === "body") {
        const index = itemId == null ? data.content.body.length : parseInt(itemId, 10);
        if (Number.isInteger(index) && index >= 0) {
          data.content.body.splice(index, 0, proposed);
        } else {
          data.content.body.push(proposed);
        }
      }
      continue;
    }

    if (section === "sender") {
      setField(data.sender, field, proposed);
    } else if (section === "recipient") {
      setField(data.recipient, field, proposed);
      if (field === "companyName") {
        data.context.companyName = proposed;
      }
    } else if (section === "context") {
      setField(data.context, field, proposed);
      if (field === "companyName") {
        data.recipient.companyName = proposed;
      }
    } else if (section === "metadata") {
      setField(data.metadata, field, proposed);
    } else if (section === "content") {
      if (field === "body" && itemId != null) {
        const idx = parseInt(itemId, 10);
        if (!isNaN(idx) && idx >= 0 && idx < data.content.body.length) {
          data.content.body[idx] = proposed;
        }
      } else {
        setField(data.content, field, proposed);
      }
    }
  }

  await CoverLetterService.update({ id: documentId, data });
  return { success: true, appliedCount: changes.length };
}

function setField(obj: Record<string, unknown>, field: string, value: unknown) {
  const segments = field.split(".");
  let current: Record<string, unknown> | null = obj;

  for (const segment of segments.slice(0, -1)) {
    const next = current?.[segment];
    if (!next || typeof next !== "object") {
      return;
    }

    current = next as Record<string, unknown>;
  }

  const lastSegment = segments.at(-1);
  if (current && lastSegment && lastSegment in current) {
    current[lastSegment] = value;
  }
}
