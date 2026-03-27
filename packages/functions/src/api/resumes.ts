import { Actor } from "@repo/core/actor";
import { ErrorCodes, VisibleError } from "@repo/core/error";
import {
  enhanceLinkedInImportedResume,
  extractResumeFromLinkedInScraperItems,
  extractResumeFromPdf,
  tryMergeLinkedInProfileItems,
} from "@repo/core/pdf-import";
import { ResumeService } from "@repo/core/resume";
import { Hono } from "hono";
import { z } from "zod";
import { generateResumePdf } from "./resume-pdf";

import {
  type AppEnv,
  assertOwnerOrAdmin,
  notFound,
  ok,
  requireAuth,
  success,
  validate,
} from "./common";
import {
  fetchLinkedInProfileImportItems,
  isLinkedInProfileImportConfigured,
} from "./linkedin-profile-import";
import { parsePdfUpload } from "./pdf-import-form";

const resumeIdSchema = z.object({
  id: z.string(),
});

const createResumeSchema = ResumeService.CreateInput.omit({
  userId: true,
});

const updateResumeSchema = ResumeService.UpdateInput.omit({
  id: true,
});

const importLinkedInSchema = z.object({
  linkedinUrl: z.string().url(),
});

function linkedInProfileUrlRefinement(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "linkedin.com") return false;
    const p = u.pathname.toLowerCase();
    return p.includes("/in/") || p.startsWith("/pub/");
  } catch {
    return false;
  }
}

async function getOwnedResume(id: string) {
  const resume = await ResumeService.byId(id);
  if (!resume) {
    throw notFound("Resume", id);
  }

  assertOwnerOrAdmin(resume.userId);
  return resume;
}

export const resumesApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const resumes = await ResumeService.listByUser({
      userId: Actor.userID(),
    });

    return ok(c, resumes);
  })
  .post("/", validate("json", createResumeSchema), async (c) => {
    const resume = await ResumeService.create({
      userId: Actor.userID(),
      ...c.req.valid("json"),
    });

    return ok(c, resume, 201);
  })
  .post("/import-pdf", async (c) => {
    const { bytes, title } = await parsePdfUpload(c, {
      titleFallback: "Imported resume",
    });

    let data;
    try {
      data = await extractResumeFromPdf(bytes);
    } catch {
      throw new VisibleError(
        "internal",
        ErrorCodes.Server.SERVICE_UNAVAILABLE,
        "We could not extract a resume from this PDF. Try a text-based PDF or a clearer scan.",
      );
    }

    const resume = await ResumeService.create({
      userId: Actor.userID(),
      title,
      data,
    });

    return ok(c, resume, 201);
  })
  .post("/import-linkedin", validate("json", importLinkedInSchema), async (c) => {
    const { linkedinUrl } = c.req.valid("json");
    if (!linkedInProfileUrlRefinement(linkedinUrl)) {
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_FORMAT,
        "URL must be a LinkedIn profile link (e.g. https://www.linkedin.com/in/your-profile)",
        "linkedinUrl",
      );
    }

    if (!isLinkedInProfileImportConfigured()) {
      throw new VisibleError(
        "internal",
        ErrorCodes.Server.SERVICE_UNAVAILABLE,
        "LinkedIn import is not configured. Set RELEVANCE_LINKEDIN_IMPORT_API_KEY to your Relevance API key (Authorization header).",
      );
    }

    let items: Record<string, unknown>[];
    try {
      items = await fetchLinkedInProfileImportItems(linkedinUrl);
    } catch (err) {
      console.error(
        "[linkedin-import]",
        JSON.stringify({
          phase: "POST /api/resumes/import-linkedin",
          userId: Actor.userID(),
          linkedinUrl,
          message: err instanceof Error ? err.message : String(err),
        }),
      );
      throw new VisibleError(
        "internal",
        ErrorCodes.Server.SERVICE_UNAVAILABLE,
        "We could not fetch this LinkedIn profile. Try again later or check the URL.",
      );
    }

    if (!items.length) {
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_FORMAT,
        "No profile data was returned for this URL.",
        "linkedinUrl",
      );
    }

    let data = tryMergeLinkedInProfileItems(items);
    if (!data) {
      try {
        data = await extractResumeFromLinkedInScraperItems(items);
      } catch {
        throw new VisibleError(
          "internal",
          ErrorCodes.Server.SERVICE_UNAVAILABLE,
          "We could not turn this profile into a resume. Try again or start from a blank resume.",
        );
      }
    }

    try {
      data = await enhanceLinkedInImportedResume(data, items);
    } catch (err) {
      console.error(
        "[linkedin-import]",
        JSON.stringify({
          phase: "enhanceLinkedInImportedResume",
          userId: Actor.userID(),
          linkedinUrl,
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    }

    const name = data.basics.name.trim();
    const title =
      name.length > 0
        ? name.length > 255
          ? name.slice(0, 255)
          : name
        : "Imported from LinkedIn";

    const resume = await ResumeService.create({
      userId: Actor.userID(),
      title,
      data,
    });

    return ok(c, resume, 201);
  })
  .get("/:id", validate("param", resumeIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    return ok(c, await getOwnedResume(id));
  })
  .get("/:id/pdf", validate("param", resumeIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const resume = await getOwnedResume(id);
    const pdf = await generateResumePdf({
      resume,
      cookieHeader: c.req.header("cookie"),
    });

    c.header("Content-Type", "application/pdf");
    c.header(
      "Content-Disposition",
      `attachment; filename="${resume.title.replace(/"/g, "")}.pdf"`,
    );
    c.header("Cache-Control", "private, no-store");

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: c.res.headers,
    });
  })
  .put(
    "/:id",
    validate("param", resumeIdSchema),
    validate("json", updateResumeSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      await getOwnedResume(id);

      const resume = await ResumeService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, resume);
    },
  )
  .delete("/:id", validate("param", resumeIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await getOwnedResume(id);
    await ResumeService.remove(id);
    return success(c);
  });
