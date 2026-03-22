import { Actor } from "@repo/core/actor";
import { CoverLetterService } from "@repo/core/cover-letter";
import { ErrorCodes, VisibleError } from "@repo/core/error";
import { extractCoverLetterFromPdf } from "@repo/core/pdf-import";
import { Hono } from "hono";
import { z } from "zod";
import { generateCoverLetterPdf } from "./cover-letter-pdf";

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

const coverLetterIdSchema = z.object({
  id: z.string(),
});

const createCoverLetterSchema = CoverLetterService.CreateInput.omit({
  userId: true,
});

const updateCoverLetterSchema = CoverLetterService.UpdateInput.omit({
  id: true,
});

async function getOwnedCoverLetter(id: string) {
  const coverLetter = await CoverLetterService.byId(id);
  if (!coverLetter) {
    throw notFound("CoverLetter", id);
  }

  assertOwnerOrAdmin(coverLetter.userId);
  return coverLetter;
}

export const coverLettersApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const coverLetters = await CoverLetterService.listByUser({
      userId: Actor.userID(),
    });

    return ok(c, coverLetters);
  })
  .post("/", validate("json", createCoverLetterSchema), async (c) => {
    const coverLetter = await CoverLetterService.create({
      userId: Actor.userID(),
      ...c.req.valid("json"),
    });

    return ok(c, coverLetter, 201);
  })
  .post("/import-pdf", async (c) => {
    const { bytes, title } = await parsePdfUpload(c, {
      titleFallback: "Imported cover letter",
    });

    let data;
    try {
      data = await extractCoverLetterFromPdf(bytes);
    } catch {
      throw new VisibleError(
        "internal",
        ErrorCodes.Server.SERVICE_UNAVAILABLE,
        "We could not extract a cover letter from this PDF. Try a text-based PDF or a clearer scan.",
      );
    }

    const coverLetter = await CoverLetterService.create({
      userId: Actor.userID(),
      title,
      data,
    });

    return ok(c, coverLetter, 201);
  })
  .get("/:id", validate("param", coverLetterIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    return ok(c, await getOwnedCoverLetter(id));
  })
  .get("/:id/pdf", validate("param", coverLetterIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const coverLetter = await getOwnedCoverLetter(id);
    const pdf = await generateCoverLetterPdf({
      coverLetter,
      cookieHeader: c.req.header("cookie"),
    });

    c.header("Content-Type", "application/pdf");
    c.header(
      "Content-Disposition",
      `attachment; filename="${coverLetter.title.replace(/"/g, "")}.pdf"`,
    );
    c.header("Cache-Control", "private, no-store");

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: c.res.headers,
    });
  })
  .put(
    "/:id",
    validate("param", coverLetterIdSchema),
    validate("json", updateCoverLetterSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      await getOwnedCoverLetter(id);

      const coverLetter = await CoverLetterService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, coverLetter);
    },
  )
  .delete("/:id", validate("param", coverLetterIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await getOwnedCoverLetter(id);
    await CoverLetterService.remove(id);
    return success(c);
  });
