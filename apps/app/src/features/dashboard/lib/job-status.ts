import {
  BadgeCheck,
  BriefcaseBusiness,
  Heart,
  MessagesSquare,
  XCircle,
} from "lucide-react"

export const jobStatusValues = [
  "shortlist",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const

export type JobStatus = (typeof jobStatusValues)[number]

export const jobStatusOrder = [
  "shortlist",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const

export const jobStatusMeta = {
  shortlist: {
    label: "Shortlist",
    accent: "text-rose-500",
    border: "border-rose-200",
    background: "bg-rose-50/70",
    icon: Heart,
  },
  applied: {
    label: "Applied",
    accent: "text-sky-500",
    border: "border-sky-200",
    background: "bg-sky-50/70",
    icon: BriefcaseBusiness,
  },
  interview: {
    label: "Interview",
    accent: "text-violet-500",
    border: "border-violet-200",
    background: "bg-violet-50/70",
    icon: MessagesSquare,
  },
  offer: {
    label: "Offer",
    accent: "text-emerald-500",
    border: "border-emerald-200",
    background: "bg-emerald-50/70",
    icon: BadgeCheck,
  },
  rejected: {
    label: "Rejected",
    accent: "text-slate-500",
    border: "border-slate-200",
    background: "bg-slate-100/70",
    icon: XCircle,
  },
} as const
