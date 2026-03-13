import { queryOptions } from "@tanstack/react-query"
import type { CoverLetterDocument } from "@repo/core/schemas"

import { api } from "#/lib/api"
import type { JobStatus } from "#/features/dashboard/lib/job-status"
import {
  buildBlankResume,
  getResume,
  listResumes,
  resumeKeys,
  sampleCoverLetter,
  updateResume,
  createResume,
} from "#/features/resume/lib/queries"

export const dashboardKeys = {
  coverLetters: ["coverLetters"] as const,
  coverLetterDetail: (id: string) => ["coverLetters", id] as const,
  jobs: ["jobs"] as const,
  jobDetail: (id: string) => ["jobs", id] as const,
}

export async function listCoverLetters() {
  const response = await api.coverLetters.list()
  return response.data
}

export async function getCoverLetter(id: string) {
  const response = await api.coverLetters.get(id)
  return response.data
}

export async function createCoverLetter(
  input: {
    title: string
    data: CoverLetterDocument
  },
) {
  const response = await api.coverLetters.create(input)
  return response.data
}

export async function updateCoverLetter(
  id: string,
  input: Partial<{
    title: string
    data: CoverLetterDocument
    isDefault: boolean
  }>,
) {
  const response = await api.coverLetters.update(id, input)
  return response.data
}

export async function deleteCoverLetter(id: string) {
  return api.coverLetters.delete(id)
}

export async function listJobs() {
  const response = await api.jobs.list()
  return response.data
}

export async function getJob(id: string) {
  const response = await api.jobs.get(id)
  return response.data
}

export async function createJob(
  input: {
    status: JobStatus
    jobTitle: string
    jobDescription?: string | null
    documents: Array<{
      id: string
      name: string
      url: string
      type: "resume" | "coverLetter" | "other"
    }>
    jobUrl?: string | null
    salary?: string | null
    position?: number | null
    notes?: string | null
    companyName: string
    companyLogoUrl?: string | null
    logoColor?: string | null
    location?: string | null
  },
) {
  const response = await api.jobs.create({
    ...input,
    jobDescription: input.jobDescription ?? undefined,
    jobUrl: input.jobUrl ?? undefined,
    salary: input.salary ?? undefined,
    position: input.position ?? undefined,
    notes: input.notes ?? undefined,
    companyLogoUrl: input.companyLogoUrl ?? undefined,
    logoColor: input.logoColor ?? undefined,
    location: input.location ?? undefined,
  })
  return response.data
}

export async function updateJob(
  id: string,
  input: Partial<{
    status: JobStatus
    jobTitle: string
    jobDescription: string | null
    documents: Array<{
      id: string
      name: string
      url: string
      type: "resume" | "coverLetter" | "other"
    }>
    jobUrl: string | null
    salary: string | null
    position: number | null
    notes: string | null
    companyName: string
    companyLogoUrl: string | null
    logoColor: string | null
    location: string | null
  }>,
) {
  const response = await api.jobs.update(id, {
    ...input,
    jobDescription: input.jobDescription ?? undefined,
    jobUrl: input.jobUrl ?? undefined,
    salary: input.salary ?? undefined,
    position: input.position ?? undefined,
    notes: input.notes ?? undefined,
    companyLogoUrl: input.companyLogoUrl ?? undefined,
    logoColor: input.logoColor ?? undefined,
    location: input.location ?? undefined,
  })
  return response.data
}

export async function deleteJob(id: string) {
  return api.jobs.delete(id)
}

export const coverLettersQueryOptions = () =>
  queryOptions({
    queryKey: dashboardKeys.coverLetters,
    queryFn: listCoverLetters,
  })

export const coverLetterDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: dashboardKeys.coverLetterDetail(id),
    queryFn: () => getCoverLetter(id),
    enabled: Boolean(id),
  })

export const jobsQueryOptions = () =>
  queryOptions({
    queryKey: dashboardKeys.jobs,
    queryFn: listJobs,
  })

export const jobDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: dashboardKeys.jobDetail(id),
    queryFn: () => getJob(id),
    enabled: Boolean(id),
  })

export type DashboardResume = Awaited<ReturnType<typeof listResumes>>[number]
export type DashboardCoverLetter = Awaited<ReturnType<typeof listCoverLetters>>[number]
export type DashboardJob = Awaited<ReturnType<typeof listJobs>>[number]

export {
  buildBlankResume,
  createResume,
  getResume,
  listResumes,
  resumeKeys,
  sampleCoverLetter,
  updateResume,
}
