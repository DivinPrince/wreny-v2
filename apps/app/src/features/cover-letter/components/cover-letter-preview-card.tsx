import type { CoverLetterInfo } from '@repo/core/cover-letter'
import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

import {
  cloneCoverLetterDocument,
  normalizeCoverLetterDocument,
} from '../lib/queries'
import {
  COVER_LETTER_PAGE_HEIGHT_PX,
  COVER_LETTER_PAGE_WIDTH_PX,
  CoverLetterRenderer,
} from '../rendering/cover-letter-renderer'

const PREVIEW_SCALE = 0.245
const PREVIEW_WIDTH = COVER_LETTER_PAGE_WIDTH_PX * PREVIEW_SCALE
const PREVIEW_HEIGHT = COVER_LETTER_PAGE_HEIGHT_PX * PREVIEW_SCALE

function buildPreviewDocument(coverLetter: CoverLetterInfo) {
  const next = cloneCoverLetterDocument(normalizeCoverLetterDocument(coverLetter.data))
  next.metadata.template = 'static'
  return next
}

function formatUpdatedDate(date: Date | string) {
  const value = date instanceof Date ? date : new Date(date)

  if (Number.isNaN(value.getTime())) {
    return 'Recently updated'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}

export function CoverLetterPreviewCard({
  coverLetter,
}: Readonly<{
  coverLetter: CoverLetterInfo
}>) {
  const previewDoc = buildPreviewDocument(coverLetter)
  const subtitle =
    previewDoc.context.companyName || previewDoc.context.jobTitle || 'Draft'

  return (
    <div className="group relative isolate flex h-[340px] w-[250px] shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <Link
        to="/dashboard/cover-letters/$id/$step"
        params={{ id: coverLetter.id, step: 'preview' }}
        className="flex min-h-0 flex-1 flex-col overflow-hidden hit-area-4"
      >
        <div className="flex shrink-0 items-center justify-center overflow-hidden bg-white p-3">
          <div
            className="cover-letter-thumbnail-frame"
            style={{
              width: PREVIEW_WIDTH,
              height: PREVIEW_HEIGHT,
            }}
          >
            <div
              className="cover-letter-thumbnail-scale"
              style={{
                width: COVER_LETTER_PAGE_WIDTH_PX,
                minHeight: COVER_LETTER_PAGE_HEIGHT_PX,
                transform: `scale(${PREVIEW_SCALE})`,
              }}
            >
              <CoverLetterRenderer
                coverLetter={previewDoc}
                mode="thumbnail"
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/90 bg-white px-4 py-3">
          <p className="truncate text-sm font-semibold text-slate-950">
            {coverLetter.title}
          </p>
          <p className="truncate text-xs text-slate-600">{subtitle}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Updated {formatUpdatedDate(coverLetter.updatedAt)}
          </p>
        </div>
      </Link>

      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 rounded-full bg-slate-200/95 shadow-sm hover:bg-slate-300/95 hover:text-foreground dark:bg-slate-700/95 dark:hover:bg-slate-600/95 dark:text-slate-200"
              onClick={(event) => event.preventDefault()}
            >
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
    </div>
  )
}
