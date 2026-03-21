import type { ResumeInfo } from '@repo/core/resume'
import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Button } from '#/components/ui/button'

import { ResumeRenderer } from '../rendering/resume-renderer'
import { cloneResumeDocument, normalizeResumeDocument } from '../lib/queries'
import type { ResumeDocument } from '@repo/core/schemas'

const PREVIEW_SCALE = 0.255
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PREVIEW_WIDTH = A4_WIDTH_PX * PREVIEW_SCALE
const PREVIEW_HEIGHT = A4_HEIGHT_PX * PREVIEW_SCALE

function buildPreviewDocument(resume: ResumeInfo): ResumeDocument {
  const doc = normalizeResumeDocument(resume.data)
  const next = cloneResumeDocument(doc)
  next.metadata.template = 'static'
  return next
}

export function ResumePreviewCard({ resume }: Readonly<{ resume: ResumeInfo }>) {
  const previewDoc = buildPreviewDocument(resume)

  return (
    <div className="group relative isolate flex h-[320px] w-full shrink-0 flex-col overflow-hidden rounded-lg border bg-white sm:w-[230px]">
      <Link
        to="/dashboard/resumes/$id/$step"
        params={{ id: resume.id, step: 'contact' }}
        className="flex min-h-0 flex-1 flex-col overflow-hidden hit-area-4"
      >
        <div className="flex shrink-0 items-center justify-center overflow-hidden p-3">
          <div
            className="overflow-hidden"
            style={{
              width: PREVIEW_WIDTH,
              height: PREVIEW_HEIGHT,
            }}
          >
            <div
              style={{
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: 'top left',
                width: A4_WIDTH_PX,
                minHeight: A4_HEIGHT_PX,
              }}
            >
              <ResumeRenderer resume={previewDoc} mode="thumbnail" />
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 rounded-full bg-slate-200/95 shadow-sm hover:bg-slate-300/95 hover:text-foreground dark:bg-slate-700/95 dark:hover:bg-slate-600/95 dark:text-slate-200"
              onClick={(e) => e.preventDefault()}
            >
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/dashboard/resumes/$id/$step" params={{ id: resume.id, step: 'contact' }}>
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
