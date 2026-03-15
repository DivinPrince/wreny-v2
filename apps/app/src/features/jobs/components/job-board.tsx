import { useCallback, useEffect, useMemo, useState } from "react"
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import type { JobInfo } from "../lib/types"
import type { JobStatus } from "../lib/types"

import { cn } from "#/lib/utils"

import { JobCard } from "./job-card"
import { JobColumn } from "./job-column"
import { useReorderJobs, type JobReorderUpdate } from "../lib/queries"
import {
  groupJobsByStatus,
  jobStatusMeta,
  jobStatusOrder,
  normalizeJobsByStatus,
  toPosition,
  type JobsByStatus,
} from "../lib/status"

type JobBoardProps = {
  jobs: JobInfo[]
}

export function JobBoard({ jobs }: JobBoardProps) {
  const [jobsByStatus, setJobsByStatus] = useState<JobsByStatus>(() =>
    groupJobsByStatus(jobs),
  )
  const [composerStatus, setComposerStatus] = useState<JobStatus | null>(null)
  const [activeJob, setActiveJob] = useState<JobInfo | null>(null)
  const reorderMutation = useReorderJobs()

  useEffect(() => {
    setJobsByStatus(groupJobsByStatus(jobs))
  }, [jobs])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const findStatusForId = useCallback(
    (id: string, state: JobsByStatus) => {
      if (id in state) {
        return id as JobStatus
      }

      for (const status of jobStatusOrder) {
        if (state[status].some((job) => job.id === id)) {
          return status
        }
      }

      return null
    },
    [],
  )

  const jobLookup = useMemo(() => {
    const map = new Map<string, JobInfo>()
    for (const status of jobStatusOrder) {
      for (const job of jobsByStatus[status]) {
        map.set(job.id, job)
      }
    }
    return map
  }, [jobsByStatus])

  function createReorderUpdates(
    previousState: JobsByStatus,
    nextState: JobsByStatus,
  ): JobReorderUpdate[] {
    const updates: JobReorderUpdate[] = []
    const prevMap = new Map<string, JobInfo>()
    for (const status of jobStatusOrder) {
      for (const job of previousState[status]) {
        prevMap.set(job.id, job)
      }
    }
    for (const status of jobStatusOrder) {
      for (const job of nextState[status]) {
        const prev = prevMap.get(job.id)
        if (!prev) continue
        if (
          prev.status !== job.status ||
          (prev.position ?? 0) !== (job.position ?? 0)
        ) {
          updates.push({
            id: job.id,
            data: {
              status: job.status,
              position: job.position ?? toPosition(0),
            },
          })
        }
      }
    }
    return updates
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id)
    setActiveJob(jobLookup.get(activeId) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null

    if (!overId) {
      setActiveJob(null)
      return
    }

    let updates: JobReorderUpdate[] = []

    setJobsByStatus((current) => {
      const sourceStatus = findStatusForId(activeId, current)
      const destinationStatus = findStatusForId(overId, current)

      if (!sourceStatus || !destinationStatus) return current

      const sourceJobs = [...current[sourceStatus]]
      const destinationJobs =
        sourceStatus === destinationStatus
          ? sourceJobs
          : [...current[destinationStatus]]

      const sourceIndex = sourceJobs.findIndex((job) => job.id === activeId)
      if (sourceIndex === -1) return current

      if (sourceStatus === destinationStatus) {
        const destinationIndex =
          overId in current
            ? sourceJobs.length - 1
            : sourceJobs.findIndex((job) => job.id === overId)

        if (destinationIndex === -1 || destinationIndex === sourceIndex) {
          return current
        }

        const nextState = {
          ...current,
          [sourceStatus]: arrayMove(sourceJobs, sourceIndex, destinationIndex),
        }
        const normalized = normalizeJobsByStatus(nextState)
        updates = createReorderUpdates(current, normalized)
        return normalized
      }

      const [movedJob] = sourceJobs.splice(sourceIndex, 1)
      if (!movedJob) return current

      const destinationIndex =
        overId in current
          ? destinationJobs.length
          : destinationJobs.findIndex((job) => job.id === overId)

      const insertAt =
        destinationIndex === -1 ? destinationJobs.length : destinationIndex

      destinationJobs.splice(insertAt, 0, {
        ...movedJob,
        status: destinationStatus,
      })

      const nextState = {
        ...current,
        [sourceStatus]: sourceJobs,
        [destinationStatus]: destinationJobs,
      }
      const normalized = normalizeJobsByStatus(nextState)
      updates = createReorderUpdates(current, normalized)
      return normalized
    })

    if (updates.length > 0) {
      reorderMutation.mutate(updates)
    }

    setActiveJob(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex overflow-x-auto pb-4">
        {jobStatusOrder.map((status) => (
          <JobColumn
            key={status}
            status={status}
            jobs={jobsByStatus[status]}
            composerOpen={composerStatus === status}
            nextPosition={toPosition(jobsByStatus[status].length)}
            onToggleComposer={(nextStatus) =>
              setComposerStatus((current) =>
                current === nextStatus ? null : nextStatus,
              )
            }
            onComposerClose={() => setComposerStatus(null)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <JobDragPreview job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

type JobDragPreviewProps = {
  job: JobInfo
}

function JobDragPreview({ job }: JobDragPreviewProps) {
  const statusInfo = jobStatusMeta[job.status]

  return (
    <div
      className={cn(
        "mb-2 cursor-pointer bg-card border-l-4 w-[280px] rounded-lg border transition-shadow",
        statusInfo.cardBorderClassName,
      )}
    >
      <div className="p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            {job.companyLogoUrl ? (
              <img
                src={job.companyLogoUrl}
                alt={job.companyName}
                className="size-8 rounded-md border-2 border-muted-foreground"
              />
            ) : (
              <div
                className="size-8 rounded-md flex items-center justify-center text-[10px] text-white font-bold"
                style={{ backgroundColor: job.logoColor ?? "#4A6EB0" }}
              >
                {job.companyName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="font-medium line-clamp-1">{job.companyName}</div>
        </div>

        {job.jobTitle ? (
          <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {job.jobTitle}
          </div>
        ) : null}

        <div className="flex justify-between items-center mt-2">
          <div />
          <statusInfo.icon
            className={cn("w-4 h-4", statusInfo.cardIconClassName)}
          />
        </div>
      </div>
    </div>
  )
}
