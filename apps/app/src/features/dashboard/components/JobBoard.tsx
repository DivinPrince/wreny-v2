import { type HTMLAttributes, useEffect, useState } from "react"
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Link } from "@tanstack/react-router"
import { Building2, ChevronRight, Plus } from "lucide-react"

import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import { Card, CardContent } from "#/components/ui/card"
import { cn } from "#/lib/utils"
import {
  type JobStatus,
  jobStatusMeta,
  jobStatusOrder,
} from "#/features/dashboard/lib/job-status"
import type { DashboardJob } from "#/features/dashboard/lib/queries"

import { useSortable } from "@dnd-kit/sortable"

type JobsState = Record<JobStatus, DashboardJob[]>

function groupJobs(jobs: DashboardJob[]): JobsState {
  const grouped: JobsState = {
    shortlist: [],
    applied: [],
    interview: [],
    offer: [],
    rejected: [],
  }

  for (const job of jobs) {
    grouped[job.status].push(job)
  }

  for (const status of jobStatusOrder) {
    grouped[status].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  return grouped
}

function SortableJobCard({ job }: Readonly<{ job: DashboardJob }>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { job },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
 
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <JobCardBody job={job} draggingHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function JobCardBody({
  job,
  draggingHandleProps,
}: Readonly<{
  job: DashboardJob
  draggingHandleProps?: HTMLAttributes<HTMLDivElement>
}>) {
  const meta = jobStatusMeta[job.status]
  const StatusIcon = meta.icon

  return (
    <Card
      className={cn(
        "mb-2 rounded-2xl border-l-4 bg-background transition-shadow hover:shadow-sm",
        meta.border,
      )}
      {...draggingHandleProps}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: job.logoColor ?? "#0f172a" }}
            >
              {job.companyLogoUrl ? (
                <img
                  src={job.companyLogoUrl}
                  alt={job.companyName}
                  className="size-10 rounded-xl object-cover"
                />
              ) : (
                <Building2 className="size-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{job.companyName}</p>
              <p className="truncate text-xs text-muted-foreground">{job.jobTitle}</p>
            </div>
          </div>
          <StatusIcon className={cn("size-4 shrink-0", meta.accent)} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Badge variant="secondary">{meta.label}</Badge>
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/dashboard/jobs/$id" params={{ id: job.id }}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function JobBoard({
  jobs,
  onCreateJob,
  onMoveJob,
}: Readonly<{
  jobs: DashboardJob[]
  onCreateJob?: (status: JobStatus) => void
  onMoveJob?: (jobId: string, status: JobStatus, position: number) => void
}>) {
  const [state, setState] = useState<JobsState>(() => groupJobs(jobs))
  const [activeJob, setActiveJob] = useState<DashboardJob | null>(null)

  useEffect(() => {
    setState(groupJobs(jobs))
  }, [jobs])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function findContainer(id: string) {
    for (const status of jobStatusOrder) {
      if (status === id) return status
      if (state[status].some((job) => job.id === id)) return status
    }

    return null
  }

  function reindex(items: DashboardJob[]) {
    return items.map((job, index) => ({ ...job, position: (index + 1) * 1000 }))
  }

  function handleDragStart(event: DragStartEvent) {
    const source = findContainer(String(event.active.id))
    if (!source) return
    const job = state[source].find((item) => item.id === event.active.id) ?? null
    setActiveJob(job)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveJob(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const source = findContainer(activeId)
    const destination = findContainer(overId)

    if (!source || !destination) return

    if (source === destination) {
      const oldIndex = state[source].findIndex((job) => job.id === activeId)
      const newIndex =
        overId === destination
          ? state[destination].length - 1
          : state[destination].findIndex((job) => job.id === overId)

      if (oldIndex < 0 || newIndex < 0) return

      const next = reindex(arrayMove(state[source], oldIndex, newIndex))
      setState((current) => ({ ...current, [source]: next }))
      next.forEach((job) => onMoveJob?.(job.id, source, job.position ?? 0))
      return
    }

    const sourceItems = [...state[source]]
    const destinationItems = [...state[destination]]
    const sourceIndex = sourceItems.findIndex((job) => job.id === activeId)
    if (sourceIndex < 0) return

    const [movedJob] = sourceItems.splice(sourceIndex, 1)
    if (!movedJob) return

    const destinationIndex =
      overId === destination
        ? destinationItems.length
        : destinationItems.findIndex((job) => job.id === overId)

    destinationItems.splice(destinationIndex < 0 ? destinationItems.length : destinationIndex, 0, {
      ...movedJob,
      status: destination,
    })

    const nextSource = reindex(sourceItems)
    const nextDestination = reindex(destinationItems)

    setState((current) => ({
      ...current,
      [source]: nextSource,
      [destination]: nextDestination,
    }))

    nextSource.forEach((job) => onMoveJob?.(job.id, source, job.position ?? 0))
    nextDestination.forEach((job) => onMoveJob?.(job.id, destination, job.position ?? 0))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {jobStatusOrder.map((status) => {
          const meta = jobStatusMeta[status]
          const StatusIcon = meta.icon
          return (
            <div
              key={status}
              className={cn(
                "min-w-[290px] flex-1 rounded-[1.5rem] border p-3",
                meta.border,
                meta.background,
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("size-4", meta.accent)} />
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <Badge variant="outline">{state[status].length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onCreateJob?.(status)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              <SortableContext
                items={state[status].map((job) => job.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-40">
                  {state[status].map((job) => (
                    <SortableJobCard key={job.id} job={job} />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeJob ? <JobCardBody job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
