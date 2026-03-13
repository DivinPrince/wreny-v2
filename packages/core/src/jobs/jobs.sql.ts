import { integer, pgEnum, pgTable } from "drizzle-orm/pg-core";

import { id, jsonb, text, timestamps, ulid } from "../drizzle/types";
import { userTable } from "../user/user.sql";

export enum JobStatus {
  SHORTLIST = "shortlist",
  APPLIED = "applied",
  INTERVIEW = "interview",
  OFFER = "offer",
  REJECTED = "rejected",
}

export const jobStatusValues = [
  JobStatus.SHORTLIST,
  JobStatus.APPLIED,
  JobStatus.INTERVIEW,
  JobStatus.OFFER,
  JobStatus.REJECTED,
] as const;

export const jobStatusEnum = pgEnum("job_status", jobStatusValues);

export interface JobDocument {
  id: string;
  name: string;
  url: string;
  type: "resume" | "coverLetter" | "other";
}

export const jobsTable = pgTable("jobs", {
  ...id,
  status: jobStatusEnum("status").notNull().default(JobStatus.SHORTLIST),
  jobTitle: text("job_title").notNull(),
  jobDescription: text("job_description"),
  userId: ulid("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  documents: jsonb("documents").$type<JobDocument[]>().default([]).notNull(),
  jobUrl: text("job_url"),
  salary: text("salary"),
  position: integer("position"),
  notes: text("notes"),
  companyName: text("company_name").notNull(),
  companyLogoUrl: text("company_logo_url"),
  logoColor: text("logo_color"),
  location: text("location"),
  ...timestamps,
});

export type Job = typeof jobsTable.$inferSelect;
export type NewJob = typeof jobsTable.$inferInsert;
