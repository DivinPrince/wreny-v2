import { Actor } from "@repo/core/actor";
import { CoverLetterService } from "@repo/core/cover-letter";
import { Hono } from "hono";
import { z } from "zod";

import {
  type AppEnv,
  assertOwnerOrAdmin,
  notFound,
  ok,
  requireAuth,
  success,
  validate,
} from "./common";

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
  .get("/:id", validate("param", coverLetterIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    return ok(c, await getOwnedCoverLetter(id));
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
