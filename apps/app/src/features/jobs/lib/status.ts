import type { JobInfo } from "./types"
import { JobStatus } from "./types"
import {
  BadgeCheck,
  BriefcaseBusiness,
  CircleX,
  Heart,
  MessageSquareMore,
  type LucideIcon,
} from "lucide-react"

export const jobStatusOrder = [
  JobStatus.SHORTLIST,
  JobStatus.APPLIED,
  JobStatus.INTERVIEW,
  JobStatus.OFFER,
  JobStatus.REJECTED,
] as const

type JobStatusMeta = {
  label: string
  icon: LucideIcon
  shellClassName: string
  softClassName: string
  borderClassName: string
  iconClassName: string
  textColor: string
}

export const jobStatusMeta: Record<JobStatus, JobStatusMeta> = {
  [JobStatus.SHORTLIST]: {
    label: "Shortlist",
    icon: Heart,
    shellClassName: "bg-blue-50",
    softClassName: "bg-blue-50",
    borderClassName: "border-blue-200",
    iconClassName: "text-blue-600",
    textColor: "text-blue-700",
  },
  [JobStatus.APPLIED]: {
    label: "Applied",
    icon: BriefcaseBusiness,
    shellClassName: "bg-orange-50",
    softClassName: "bg-orange-50",
    borderClassName: "border-orange-200",
    iconClassName: "text-orange-600",
    textColor: "text-orange-700",
  },
  [JobStatus.INTERVIEW]: {
    label: "Interview",
    icon: MessageSquareMore,
    shellClassName: "bg-purple-50",
    softClassName: "bg-purple-50",
    borderClassName: "border-purple-200",
    iconClassName: "text-purple-600",
    textColor: "text-purple-700",
  },
  [JobStatus.OFFER]: {
    label: "Offer",
    icon: BadgeCheck,
    shellClassName: "bg-green-50",
    softClassName: "bg-green-50",
    borderClassName: "border-green-200",
    iconClassName: "text-green-600",
    textColor: "text-green-700",
  },
  [JobStatus.REJECTED]: {
    label: "Rejected",
    icon: CircleX,
    shellClassName: "bg-red-50",
    softClassName: "bg-red-50",
    borderClassName: "border-red-200",
    iconClassName: "text-red-600",
    textColor: "text-red-700",
  },
}

export type JobsByStatus = Record<JobStatus, JobInfo[]>

export function createEmptyJobsByStatus(): JobsByStatus {
  return {
    [JobStatus.SHORTLIST]: [],
    [JobStatus.APPLIED]: [],
    [JobStatus.INTERVIEW]: [],
    [JobStatus.OFFER]: [],
    [JobStatus.REJECTED]: [],
  }
}

export function groupJobsByStatus(jobs: JobInfo[]): JobsByStatus {
  const grouped = createEmptyJobsByStatus()

  for (const job of jobs) {
    grouped[job.status].push(job)
  }

  for (const status of jobStatusOrder) {
    grouped[status].sort((left, right) => {
      const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER
      const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER

      if (leftPosition === rightPosition) {
        return (
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        )
      }

      return leftPosition - rightPosition
    })
  }

  return grouped
}

export function toPosition(index: number) {
  return (index + 1) * 1000
}

export function normalizeJobsByStatus(jobsByStatus: JobsByStatus): JobsByStatus {
  const normalized = createEmptyJobsByStatus()

  for (const status of jobStatusOrder) {
    normalized[status] = jobsByStatus[status].map((job, index) => ({
      ...job,
      status,
      position: toPosition(index),
    }))
  }

  return normalized
}
