import type { CoverLetterInfo } from '@repo/core/cover-letter'
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

import {
  COVER_LETTER_PAGE_HEIGHT_PX,
  COVER_LETTER_PAGE_WIDTH_PX,
  CoverLetterRenderer,
} from '../rendering/cover-letter-renderer'
import {
  cloneCoverLetterDocument,
  normalizeCoverLetterDocument,
} from '../lib/queries'

import { cn } from '#/lib/utils'

const LIST_PREVIEW_SCALE = 0.06
const LIST_PREVIEW_WIDTH = COVER_LETTER_PAGE_WIDTH_PX * LIST_PREVIEW_SCALE
const LIST_PREVIEW_HEIGHT = COVER_LETTER_PAGE_HEIGHT_PX * LIST_PREVIEW_SCALE

function buildPreviewDocument(coverLetter: CoverLetterInfo) {
  const next = cloneCoverLetterDocument(normalizeCoverLetterDocument(coverLetter.data))
  next.metadata.template = 'static'
  return next
}

export function CoverLetterListRow({
  coverLetter,
  className,
}: Readonly<{ coverLetter: CoverLetterInfo; className?: string }>) {
  const previewDoc = buildPreviewDocument(coverLetter)
  const subtitle =
    previewDoc.context.companyName || previewDoc.context.jobTitle || 'Draft'
  const created = coverLetter.createdAt
    ? formatDistanceToNow(new Date(coverLetter.createdAt), { addSuffix: true })
    : '—'
  const edited = coverLetter.updatedAt
    ? formatDistanceToNow(new Date(coverLetter.updatedAt), { addSuffix: true })
    : '—'

  return (
    <Link
      to="/dashboard/cover-letters/$id/$step"
      params={{ id: coverLetter.id, step: 'preview' }}
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
              width: COVER_LETTER_PAGE_WIDTH_PX,
              minHeight: COVER_LETTER_PAGE_HEIGHT_PX,
            }}
          >
            <CoverLetterRenderer coverLetter={previewDoc} mode="thumbnail" />
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <span className="font-medium text-foreground">{coverLetter.title || 'Untitled'}</span>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
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
              <Link
                to="/dashboard/cover-letters/$id/$step"
                params={{ id: coverLetter.id, step: 'preview' }}
              >
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  )
}
