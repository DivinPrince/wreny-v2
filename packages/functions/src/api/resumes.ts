import { Actor } from "@repo/core/actor";
import { ResumeService } from "@repo/core/resume";
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
  .get("/:id", validate("param", resumeIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    return ok(c, await getOwnedResume(id));
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
