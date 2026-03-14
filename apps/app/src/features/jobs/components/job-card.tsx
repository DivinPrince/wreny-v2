import { useState } from "react"
import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { ChevronRight } from "lucide-react"
import type { JobInfo } from "../lib/types"

import { Button } from "#/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip"
import { cn } from "#/lib/utils"

import { JobSheet } from "./job-sheet"
import { jobStatusMeta } from "../lib/status"

type JobCardProps = {
  job: JobInfo
}

export function JobCard({ job }: JobCardProps) {
  const [open, setOpen] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: job.id,
  })

  const statusInfo = jobStatusMeta[job.status]
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleCardClick(e: React.MouseEvent) {
    if (isDragging) return
    e.stopPropagation()
    setOpen(true)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(isDragging && "opacity-50 z-10", "touch-manipulation")}
      >
        <div
          className={cn(
            "mb-2 cursor-pointer bg-card border-l-4 rounded-lg border transition-shadow hover:shadow-md",
            statusInfo.borderClassName,
            isDragging && "shadow-lg",
          )}
          onClick={handleCardClick}
          {...attributes}
          {...listeners}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpen(true)
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Job Details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                className={cn("w-4 h-4", statusInfo.iconClassName)}
              />
            </div>
          </div>
        </div>
      </div>

      <JobSheet job={job} open={open} onOpenChange={setOpen} />
    </>
  )
}
