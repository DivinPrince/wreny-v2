import { tool } from "ai";
import { z } from "zod";

import { CoverLetterService } from "../cover-letter";
import { JobsService } from "../jobs";
import { ResumeService } from "../resume";
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
- "awards", "certifications", "volunteer", "publications", "references": require itemId with their respective fields

For COVER LETTERS, valid sections and their fields:
- "sender": fields are "name", "email", "phone", "location", "title"
- "recipient": fields are "name", "title", "companyName", "location", "email"
- "context": fields are "jobTitle", "companyName", "jobUrl"
- "content": fields are "greeting", "opening", "closing", "signature", "body" (use paragraph index as itemId, e.g. "0", "1")

Operations:
- "replace": normal field edit. Include section, field, original, proposed, and itemId when needed.
- "delete-item": remove one resume list item entirely. Use the section, the target itemId, field "__item__", original as a short label for the item being removed, and proposed as an empty string.
- "set-section-visible": hide or show a whole resume section. Use the section, field "visible", original "true" or "false", and proposed "false" to hide or "true" to show.

Always include both the original and proposed text so the user can see the diff.`,
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

async function applyResumeChanges(documentId: string, changes: Change[]) {
  const resume = await ResumeService.byId(documentId);
  if (!resume) return { error: "Resume not found" };

  const data: ResumeDocument = structuredClone(resume.data);

  for (const change of changes) {
    const { operation, section, itemId, field, proposed } = change;

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
    const { section, itemId, field, proposed } = change;

    if (section === "sender") {
      setField(data.sender, field, proposed);
    } else if (section === "recipient") {
      setField(data.recipient, field, proposed);
    } else if (section === "context") {
      setField(data.context, field, proposed);
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
