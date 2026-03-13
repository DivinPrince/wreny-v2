import { Actor } from "@repo/core/actor";
import { JobsService, JobStatus } from "@repo/core/jobs";
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

const jobIdSchema = z.object({
  id: z.string(),
});

const jobsListQuerySchema = z.object({
  status: z.nativeEnum(JobStatus).optional(),
  search: z.string().optional(),
});

const createJobSchema = JobsService.CreateInput.omit({
  userId: true,
});

const updateJobSchema = JobsService.UpdateInput.omit({
  id: true,
});

async function getOwnedJob(id: string) {
  const job = await JobsService.byId(id);
  if (!job) {
    throw notFound("Job", id);
  }

  assertOwnerOrAdmin(job.userId);
  return job;
}

export const jobsApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", validate("query", jobsListQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const jobs = await JobsService.list({
      userId: Actor.userID(),
      status: query.status,
      search: query.search,
    });

    return ok(c, jobs);
  })
  .post("/", validate("json", createJobSchema), async (c) => {
    const job = await JobsService.create({
      userId: Actor.userID(),
      ...c.req.valid("json"),
    });

    return ok(c, job, 201);
  })
  .get("/:id", validate("param", jobIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    return ok(c, await getOwnedJob(id));
  })
  .put(
    "/:id",
    validate("param", jobIdSchema),
    validate("json", updateJobSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      await getOwnedJob(id);

      const job = await JobsService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, job);
    },
  )
  .delete("/:id", validate("param", jobIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await getOwnedJob(id);
    await JobsService.remove(id);
    return success(c);
  });
