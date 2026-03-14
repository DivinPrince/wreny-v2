import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import type { JobInfo } from "../lib/types"
import { JobStatus } from "../lib/types"

import { Button } from "#/components/ui/button"
import { cn } from "#/lib/utils"

import { JobCard } from "./job-card"
import { JobQuickAdd } from "./job-quick-add"
import { jobStatusMeta } from "../lib/status"

type JobColumnProps = {
  status: JobStatus
  jobs: JobInfo[]
  composerOpen: boolean
  nextPosition: number
  onToggleComposer: (status: JobStatus) => void
  onComposerClose: () => void
}

export function JobColumn({
  status,
  jobs,
  composerOpen,
  nextPosition,
  onToggleComposer,
  onComposerClose,
}: JobColumnProps) {
  const statusInfo = jobStatusMeta[status]
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      className={cn(
        "flex-1 mx-2 min-w-[280px] max-w-[320px] h-fit rounded-lg px-2 pb-2 transition-all duration-300",
        statusInfo.shellClassName,
        isOver && "ring-2 ring-primary",
      )}
    >
      <div className="px-2 py-1.5 w-full">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <statusInfo.icon className={cn("w-4 h-4", statusInfo.iconClassName)} />
            <h2 className={statusInfo.textColor}>
              {statusInfo.label}
              <span className="ml-2 text-muted-foreground text-sm font-normal">
                {jobs.length}
              </span>
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onToggleComposer(status)}
            className="hover:bg-transparent border-none"
          >
            <Plus className={cn("w-4 h-4 opacity-80", statusInfo.iconClassName)} />
          </Button>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {composerOpen ? (
          <div className="mb-3 bg-card p-4 rounded-lg">
            <JobQuickAdd
              status={status}
              nextPosition={nextPosition}
              onCancel={onComposerClose}
              onCreated={onComposerClose}
            />
          </div>
        ) : null}

        <SortableContext
          items={jobs.map((job) => job.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.length > 0 ? (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <div />
          )}
        </SortableContext>
      </div>

      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start items-center border hover:bg-transparent",
          statusInfo.borderClassName,
        )}
        onClick={() => onToggleComposer(status)}
      >
        <Plus className={cn("w-4 h-4 mr-6", statusInfo.iconClassName)} />
        Add Job
      </Button>
    </div>
  )
}
