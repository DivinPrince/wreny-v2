import { and, asc, eq, ilike, type SQL } from "drizzle-orm";
import { z } from "zod";

import { withTransaction } from "../drizzle/transaction";
import { NotFoundError } from "../error";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import {
  jobsTable,
  JobStatus,
  jobStatusValues,
  type JobDocument,
} from "./jobs.sql";

export * from "./jobs.sql";

const jobDocumentSchema = z
  .object({
    id: z.string().meta({ description: "Attached document ID" }),
    name: z.string().meta({ description: "Attached document display name" }),
    url: z.string().meta({ description: "Public URL for the document" }),
    type: z
      .enum(["resume", "coverLetter", "other"])
      .meta({ description: "Attached document type" }),
  })
  .meta({ ref: "JobDocument", description: "Document attached to a job" });

const jobStatusSchema = z
  .enum(jobStatusValues)
  .meta({ ref: "JobStatus", description: "Current job application status" });

const defaultJobDocuments: JobDocument[] = [];

export namespace JobsService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Job ID" }),
      status: jobStatusSchema,
      jobTitle: z.string().meta({ description: "Job title" }),
      jobDescription: z
        .string()
        .nullable()
        .meta({ description: "Job description" }),
      userId: z.string().meta({ description: "Owner user ID" }),
      documents: z
        .array(jobDocumentSchema)
        .meta({ description: "Attached documents for the job" }),
      jobUrl: z.string().nullable().meta({ description: "External job posting URL" }),
      salary: z.string().nullable().meta({ description: "Salary information" }),
      position: z.number().nullable().meta({ description: "List position for sorting" }),
      notes: z.string().nullable().meta({ description: "Internal job notes" }),
      companyName: z.string().meta({ description: "Company name" }),
      companyLogoUrl: z
        .string()
        .nullable()
        .meta({ description: "Company logo URL" }),
      logoColor: z.string().nullable().meta({ description: "Logo accent color" }),
      location: z.string().nullable().meta({ description: "Job location" }),
      createdAt: z.date().meta({ description: "Creation date" }),
      updatedAt: z.date().meta({ description: "Last update date" }),
    })
    .meta({ ref: "Job", description: "Tracked job application" });

  export const CreateInput = z.object({
    userId: z.string(),
    status: jobStatusSchema.default(JobStatus.SHORTLIST),
    jobTitle: z.string().min(1).max(255),
    jobDescription: z.string().optional(),
    documents: z.array(jobDocumentSchema).default(defaultJobDocuments),
    jobUrl: z.union([z.string().url(), z.literal("")]).optional(),
    salary: z.string().optional(),
    position: z.number().int().optional(),
    notes: z.string().optional(),
    companyName: z.string().min(1).max(255),
    companyLogoUrl: z.union([z.string().url(), z.literal("")]).optional(),
    logoColor: z.string().optional(),
    location: z.string().optional(),
  });

  export const UpdateInput = z.object({
    id: z.string(),
    status: jobStatusSchema.optional(),
    jobTitle: z.string().min(1).max(255).optional(),
    jobDescription: z.string().optional(),
    documents: z.array(jobDocumentSchema).optional(),
    jobUrl: z.union([z.string().url(), z.literal("")]).optional(),
    salary: z.string().optional(),
    position: z.number().int().optional(),
    notes: z.string().optional(),
    companyName: z.string().min(1).max(255).optional(),
    companyLogoUrl: z.union([z.string().url(), z.literal("")]).optional(),
    logoColor: z.string().optional(),
    location: z.string().optional(),
  });

  export const ListInput = z.object({
    userId: z.string(),
    status: jobStatusSchema.optional(),
    search: z.string().optional(),
  });

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [job] = await tx
        .select()
        .from(jobsTable)
        .where(eq(jobsTable.id, id))
        .limit(1);

      return job ? serialize(job) : undefined;
    });
  });

  export const list = fn(ListInput, async (input) => {
    return withTransaction(async (tx) => {
      const conditions: SQL<unknown>[] = [eq(jobsTable.userId, input.userId)];

      if (input.status) {
        conditions.push(eq(jobsTable.status, input.status));
      }

      if (input.search) {
        conditions.push(
          ilike(jobsTable.jobTitle, `%${input.search}%`),
        );
      }

      const jobs = await tx
        .select()
        .from(jobsTable)
        .where(and(...conditions))
        .orderBy(asc(jobsTable.position), asc(jobsTable.createdAt));

      return jobs.map(serialize);
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const [job] = await tx
        .insert(jobsTable)
        .values({
          id: createID("job"),
          userId: input.userId,
          status: input.status,
          jobTitle: input.jobTitle,
          jobDescription: input.jobDescription,
          documents: input.documents,
          jobUrl: normalizeOptionalUrl(input.jobUrl),
          salary: input.salary,
          position: input.position,
          notes: input.notes,
          companyName: input.companyName,
          companyLogoUrl: normalizeOptionalUrl(input.companyLogoUrl),
          logoColor: input.logoColor,
          location: input.location,
        })
        .returning();

      if (!job) {
        throw new Error("Failed to create job.");
      }

      return serialize(job);
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    return withTransaction(async (tx) => {
      const { id, ...data } = input;
      const [job] = await tx
        .update(jobsTable)
        .set({
          ...data,
          jobUrl:
            data.jobUrl === undefined ? undefined : normalizeOptionalUrl(data.jobUrl),
          companyLogoUrl:
            data.companyLogoUrl === undefined
              ? undefined
              : normalizeOptionalUrl(data.companyLogoUrl),
        })
        .where(eq(jobsTable.id, id))
        .returning();

      if (!job) {
        throw new NotFoundError("Job", id);
      }

      return serialize(job);
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [job] = await tx
        .delete(jobsTable)
        .where(eq(jobsTable.id, id))
        .returning();

      if (!job) {
        throw new NotFoundError("Job", id);
      }

      return serialize(job);
    });
  });

  function serialize(job: typeof jobsTable.$inferSelect): z.infer<typeof Info> {
    return {
      id: job.id,
      status: job.status,
      jobTitle: job.jobTitle,
      jobDescription: job.jobDescription,
      userId: job.userId,
      documents: job.documents,
      jobUrl: job.jobUrl,
      salary: job.salary,
      position: job.position,
      notes: job.notes,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      logoColor: job.logoColor,
      location: job.location,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  function normalizeOptionalUrl(value: string | undefined) {
    if (value === undefined || value === "") {
      return null;
    }

    return value;
  }
}

export type JobInfo = z.infer<typeof JobsService.Info>;
export type JobCreateInput = z.infer<typeof JobsService.CreateInput>;
export type JobUpdateInput = z.infer<typeof JobsService.UpdateInput>;
