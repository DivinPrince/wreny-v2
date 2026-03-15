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
  /** Muted variant for cards - softer border in dark mode */
  cardBorderClassName: string
  iconClassName: string
  /** Muted variant for card icons - subtler in dark mode */
  cardIconClassName: string
  textColor: string
}

export const jobStatusMeta: Record<JobStatus, JobStatusMeta> = {
  [JobStatus.SHORTLIST]: {
    label: "Shortlist",
    icon: Heart,
    shellClassName: "bg-blue-50 dark:bg-blue-950/50",
    softClassName: "bg-blue-50 dark:bg-blue-950/50",
    borderClassName: "border-blue-200 dark:border-blue-800",
    cardBorderClassName: "border-blue-200 dark:border-blue-900/40",
    iconClassName: "text-blue-600 dark:text-blue-400",
    cardIconClassName: "text-blue-600 dark:text-blue-500/80",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  [JobStatus.APPLIED]: {
    label: "Applied",
    icon: BriefcaseBusiness,
    shellClassName: "bg-orange-50 dark:bg-orange-950/50",
    softClassName: "bg-orange-50 dark:bg-orange-950/50",
    borderClassName: "border-orange-200 dark:border-orange-800",
    cardBorderClassName: "border-orange-200 dark:border-orange-900/40",
    iconClassName: "text-orange-600 dark:text-orange-400",
    cardIconClassName: "text-orange-600 dark:text-orange-500/80",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  [JobStatus.INTERVIEW]: {
    label: "Interview",
    icon: MessageSquareMore,
    shellClassName: "bg-purple-50 dark:bg-purple-950/50",
    softClassName: "bg-purple-50 dark:bg-purple-950/50",
    borderClassName: "border-purple-200 dark:border-purple-800",
    cardBorderClassName: "border-purple-200 dark:border-purple-900/40",
    iconClassName: "text-purple-600 dark:text-purple-400",
    cardIconClassName: "text-purple-600 dark:text-purple-500/80",
    textColor: "text-purple-700 dark:text-purple-300",
  },
  [JobStatus.OFFER]: {
    label: "Offer",
    icon: BadgeCheck,
    shellClassName: "bg-green-50 dark:bg-green-950/50",
    softClassName: "bg-green-50 dark:bg-green-950/50",
    borderClassName: "border-green-200 dark:border-green-800",
    cardBorderClassName: "border-green-200 dark:border-green-900/40",
    iconClassName: "text-green-600 dark:text-green-400",
    cardIconClassName: "text-green-600 dark:text-green-500/80",
    textColor: "text-green-700 dark:text-green-300",
  },
  [JobStatus.REJECTED]: {
    label: "Rejected",
    icon: CircleX,
    shellClassName: "bg-red-50 dark:bg-red-950/50",
    softClassName: "bg-red-50 dark:bg-red-950/50",
    borderClassName: "border-red-200 dark:border-red-800",
    cardBorderClassName: "border-red-200 dark:border-red-900/40",
    iconClassName: "text-red-600 dark:text-red-400",
    cardIconClassName: "text-red-600 dark:text-red-500/80",
    textColor: "text-red-700 dark:text-red-300",
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
