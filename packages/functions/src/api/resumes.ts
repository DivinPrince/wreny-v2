import { Actor } from "@repo/core/actor";
import { ErrorCodes, VisibleError } from "@repo/core/error";
import { extractResumeFromPdf } from "@repo/core/pdf-import";
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
