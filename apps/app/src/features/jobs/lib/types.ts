/**
 * Client-safe job types. Do not import from @repo/core/jobs in app code —
 * that package pulls in the database layer and requires DATABASE_URL.
 */

export const JobStatus = {
  SHORTLIST: "shortlist",
  APPLIED: "applied",
  INTERVIEW: "interview",
  OFFER: "offer",
  REJECTED: "rejected",
} as const

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus]

export interface JobDocument {
  id: string
  name: string
  url: string
  type: "resume" | "coverLetter" | "other"
}

export interface JobInfo {
  id: string
  status: JobStatus
  jobTitle: string
  jobDescription: string | null
  userId: string
  documents: JobDocument[]
  jobUrl: string | null
  salary: string | null
  position: number | null
  notes: string | null
  companyName: string
  companyLogoUrl: string | null
  logoColor: string | null
  location: string | null
  createdAt: Date
  updatedAt: Date
}

export interface JobCreateInput {
  userId: string
  status?: JobStatus
  jobTitle: string
  jobDescription?: string
  documents?: JobDocument[]
  jobUrl?: string
  salary?: string
  position?: number
  notes?: string
  companyName: string
  companyLogoUrl?: string
  logoColor?: string
  location?: string
}

export interface JobUpdateInput {
  id: string
  status?: JobStatus
  jobTitle?: string
  jobDescription?: string
  documents?: JobDocument[]
  jobUrl?: string
  salary?: string
  position?: number
  notes?: string
  companyName?: string
  companyLogoUrl?: string
  logoColor?: string
  location?: string
}
