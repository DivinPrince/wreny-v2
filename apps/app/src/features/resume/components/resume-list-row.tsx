import type { ResumeInfo } from '@repo/core/resume'
import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

import { cn } from '#/lib/utils'

const LIST_PREVIEW_SCALE = 0.06
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const LIST_PREVIEW_WIDTH = A4_WIDTH_PX * LIST_PREVIEW_SCALE
const LIST_PREVIEW_HEIGHT = A4_HEIGHT_PX * LIST_PREVIEW_SCALE

function buildPreviewDocument(resume: ResumeInfo): ResumeDocument {
  const doc = normalizeResumeDocument(resume.data)
  const next = cloneResumeDocument(doc)
  next.metadata.template = 'static'
  return next
}

export function ResumeListRow({
  resume,
  className,
}: Readonly<{ resume: ResumeInfo; className?: string }>) {
  const previewDoc = buildPreviewDocument(resume)
  const created = resume.createdAt
    ? formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })
    : '—'
  const edited = resume.updatedAt
    ? formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })
    : '—'

  return (
    <Link
      to="/dashboard/resumes/$id/$step"
      params={{ id: resume.id, step: 'contact' }}
      className={cn(
        'group grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center rounded-lg px-4 py-3 transition-colors hover:bg-muted/50 hit-area-y-2 sm:grid-cols-[auto_1fr_6rem_6rem_auto]',
        className
      )}
    >
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-white p-1"
        style={{ width: LIST_PREVIEW_WIDTH + 8, height: LIST_PREVIEW_HEIGHT + 8 }}
      >
        <div
          className="overflow-hidden"
          style={{
            width: LIST_PREVIEW_WIDTH,
            height: LIST_PREVIEW_HEIGHT,
          }}
        >
          <div
            style={{
              transform: `scale(${LIST_PREVIEW_SCALE})`,
              transformOrigin: 'top left',
              width: A4_WIDTH_PX,
              minHeight: A4_HEIGHT_PX,
            }}
          >
            <ResumeRenderer resume={previewDoc} mode="thumbnail" />
          </div>
        </div>
      </div>
      <span className="min-w-0 font-medium text-foreground">{resume.title || 'Untitled'}</span>
      <span className="hidden text-sm text-muted-foreground sm:block">{created}</span>
      <span className="hidden text-sm text-muted-foreground sm:block">{edited}</span>
      <div
        className="opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={(e) => e.preventDefault()}>
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
    </Link>
  )
}
