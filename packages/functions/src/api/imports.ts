import { Actor } from "@repo/core/actor";
import { CoverLetterService } from "@repo/core/cover-letter";
import { ErrorCodes, VisibleError } from "@repo/core/error";
import {
  classifyImportedDocumentKindFromPdf,
  extractCoverLetterFromPdf,
  extractResumeFromPdf,
} from "@repo/core/pdf-import";
import { ResumeService } from "@repo/core/resume";
import { Hono } from "hono";

import { type AppEnv, ok, requireAuth } from "./common";
import { parsePdfUpload } from "./pdf-import-form";

export const importsApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  .post("/document-pdf", async (c) => {
    const { bytes, title } = await parsePdfUpload(c, {
      titleFallback: "Imported document",
    });

    let kind: "resume" | "coverLetter";
    try {
      kind = await classifyImportedDocumentKindFromPdf(bytes);
    } catch {
      throw new VisibleError(
        "internal",
        ErrorCodes.Server.SERVICE_UNAVAILABLE,
        "We could not analyze this PDF. Try again or use a clearer file.",
      );
    }

    try {
      if (kind === "resume") {
        const data = await extractResumeFromPdf(bytes);
        const resume = await ResumeService.create({
          userId: Actor.userID(),
          title,
          data,
        });
        return ok(c, { kind: "resume" as const, ...resume }, 201);
      }

      const data = await extractCoverLetterFromPdf(bytes);
      const coverLetter = await CoverLetterService.create({
        userId: Actor.userID(),
        title,
        data,
      });
      return ok(c, { kind: "coverLetter" as const, ...coverLetter }, 201);
    } catch {
      throw new VisibleError(
        "internal",
        ErrorCodes.Server.SERVICE_UNAVAILABLE,
        kind === "resume"
          ? "We could not extract a resume from this PDF. Try a text-based PDF or a clearer scan."
          : "We could not extract a cover letter from this PDF. Try a text-based PDF or a clearer scan.",
      );
    }
  });
