import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  BriefcaseBusiness,
  ChevronDown,
  Info,
  Link as LinkIcon,
  Loader2,
  MapPinned,
  Paperclip,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react"
import type { JobInfo } from "../lib/types"
import { JobStatus } from "../lib/types"

import { Button } from "#/components/ui/button"
import { Icons } from "#/components/ui/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { Input } from "#/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet"
import { Textarea } from "#/components/ui/textarea"

import { useDeleteJob, useUpdateJob } from "../lib/queries"
import { jobStatusMeta, jobStatusOrder } from "../lib/status"

type JobSheetProps = {
  job: JobInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type JobDraft = {
  companyName: string
  jobTitle: string
  jobUrl: string
  location: string
  salary: string
  notes: string
  jobDescription: string
  status: JobStatus
}

function getDraft(job: JobInfo | null): JobDraft {
  return {
    companyName: job?.companyName ?? "",
    jobTitle: job?.jobTitle ?? "",
    jobUrl: job?.jobUrl ?? "",
    location: job?.location ?? "",
    salary: job?.salary ?? "",
    notes: job?.notes ?? "",
    jobDescription: job?.jobDescription ?? "",
    status: job?.status ?? JobStatus.SHORTLIST,
  }
}

export function JobSheet({ job, open, onOpenChange }: JobSheetProps) {
  const [draft, setDraft] = useState<JobDraft>(getDraft(job))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const updateJobMutation = useUpdateJob()
  const deleteJobMutation = useDeleteJob()

  useEffect(() => {
    setDraft(getDraft(job))
    setConfirmDelete(false)
  }, [job, open])

  if (!job) {
    return null
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await updateJobMutation.mutateAsync({
      id: job.id,
      data: {
        companyName: draft.companyName.trim(),
        jobTitle: draft.jobTitle.trim(),
        jobUrl: draft.jobUrl.trim(),
        location: draft.location.trim(),
        salary: draft.salary.trim(),
        notes: draft.notes.trim(),
        jobDescription: draft.jobDescription.trim(),
        status: draft.status,
      },
    })

    onOpenChange(false)
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    await deleteJobMutation.mutateAsync(job.id)
    onOpenChange(false)
  }

  const companyInitial = job.companyName.charAt(0).toUpperCase() || "?"
  const lastUpdated = formatDistanceToNow(new Date(job.updatedAt), {
    addSuffix: true,
  })
  const currentStatusMeta = jobStatusMeta[draft.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md"
      >
        <SheetTitle className="sr-only">{job.companyName}</SheetTitle>
        <SheetHeader className="shrink-0 border-b pb-4">
          <div className="flex items-center gap-3">
            <div
              className="size-12 shrink-0 rounded-md flex items-center justify-center text-[12px] text-white font-bold"
              style={{ backgroundColor: job.logoColor ?? "#4A6EB0" }}
            >
              {companyInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Company</p>
              <Input
                value={draft.companyName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    companyName: event.target.value,
                  }))
                }
                className="mt-0.5 border-none bg-transparent px-0 py-0 shadow-none text-base font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Company Name"
              />
              <SheetDescription className="mt-1 text-xs">
                Last updated {lastUpdated}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSave}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
          <DetailRow label="Status" icon={currentStatusMeta.icon}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-full justify-between font-normal"
                >
                  <span>{jobStatusMeta[draft.status].label}</span>
                  <ChevronDown className="size-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuRadioGroup
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      status: value as JobStatus,
                    }))
                  }
                >
                  {jobStatusOrder.map((status) => (
                    <DropdownMenuRadioItem key={status} value={status}>
                      {jobStatusMeta[status].label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </DetailRow>

          <DetailRow label="Job Title" icon={BriefcaseBusiness}>
            <Input
              value={draft.jobTitle}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  jobTitle: event.target.value,
                }))
              }
              placeholder="Enter job title"
              className="h-8"
            />
          </DetailRow>

          <DetailRow label="Location" icon={MapPinned}>
            <Input
              value={draft.location}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="united states"
              className="h-8"
            />
          </DetailRow>

          <DetailRow label="URL" icon={LinkIcon}>
            <Input
              value={draft.jobUrl}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  jobUrl: event.target.value,
                }))
              }
              placeholder="https://company.com/jobs/role"
              className="h-8"
              type="url"
            />
          </DetailRow>

          <details className="border-b">
            <summary className="flex cursor-pointer list-none items-center py-2 text-sm">
              <Paperclip className="mr-2 size-4 shrink-0" />
              <span>Documents</span>
            </summary>
            <div className="pb-4 pl-6 text-sm text-muted-foreground">
              Documents support can be added next.
            </div>
          </details>

          <details className="border-b">
            <summary className="flex cursor-pointer list-none items-center py-2 text-sm">
              <Info className="mr-2 size-4 shrink-0" />
              <span>Notes</span>
            </summary>
            <div className="pb-4">
              <Textarea
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={3}
                className="min-h-[100px] resize-none"
                placeholder="type some notes about this job"
              />
            </div>
          </details>

          <details className="border-b">
            <summary className="flex cursor-pointer list-none items-center py-2 text-sm">
              <Icons.File className="mr-2 size-4 shrink-0" />
              <span>Description</span>
            </summary>
            <div className="pb-4">
              <Textarea
                value={draft.jobDescription}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    jobDescription: event.target.value,
                  }))
                }
                rows={4}
                className="min-h-[120px] resize-none"
                placeholder="Brief overview of the responsibilities and qualifications for the job"
              />
            </div>
          </details>

          <DetailRow label="Salary" icon={Wallet}>
            <Input
              value={draft.salary}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  salary: event.target.value,
                }))
              }
              placeholder="Empty"
              className="h-8"
            />
          </DetailRow>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t pt-4">
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
              disabled={deleteJobMutation.isPending}
            >
              {deleteJobMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Removing
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  {confirmDelete ? "Confirm Delete" : "Delete Job"}
                </>
              )}
            </Button>
            <Button
              type="submit"
              className="w-full"
              disabled={
                updateJobMutation.isPending ||
                draft.companyName.trim().length === 0 ||
                draft.jobTitle.trim().length === 0
              }
            >
              {updateJobMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Tag className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

type DetailRowProps = {
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  children: React.ReactNode
}

function DetailRow({ label, icon: Icon, children }: DetailRowProps) {
  return (
    <div className="flex items-center border-b pb-2">
      <div className="mr-2 flex w-1/3 items-center">
        <Icon className="mr-2 size-4" />
        <span>{label}</span>
      </div>
      <div className="w-2/3">{children}</div>
    </div>
  )
}
