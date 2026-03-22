import type { CSSProperties } from 'react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ResumeDocument } from '@repo/core/schemas'
import { Loader2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

import type { PageDocumentAttachment } from '#/features/agent/agent-page-attach-controls'
import {
  cloneCoverLetterDocument,
  coverLetterDetailQueryOptions,
  normalizeCoverLetterDocument,
} from '#/features/cover-letter/lib/queries'
import {
  COVER_LETTER_PAGE_WIDTH_PX,
  CoverLetterRenderer,
} from '#/features/cover-letter/rendering/cover-letter-renderer'
import {
  cloneResumeDocument,
  normalizeResumeDocument,
  resumeDetailQueryOptions,
} from '#/features/resume/lib/queries'
import { pageSizeMap } from '#/features/resume/lib/template-utils'
import { MM_TO_PX } from '#/features/resume/rendering/Page'
import { ResumeRenderer } from '#/features/resume/rendering/resume-renderer'

function resumePageSizePxForDoc(doc: ResumeDocument | null | undefined): {
  width: number
  height: number
} {
  if (doc == null) {
    const a4 = pageSizeMap.a4
    return { width: a4.width * MM_TO_PX, height: a4.height * MM_TO_PX }
  }
  const normalized = normalizeResumeDocument(cloneResumeDocument(doc))
  const spec = pageSizeMap[normalized.metadata.page.format]
  return { width: spec.width * MM_TO_PX, height: spec.height * MM_TO_PX }
}

function useFitPageScale(pageWidthPx: number, enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.72)

  useLayoutEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const w = el.clientWidth
      /* Match builder preview-step (~32px total horizontal margin) so the page fits reliably. */
      const pad = 16
      const inner = Math.max(120, w - pad * 2)
      const s = Math.min(1.08, Math.max(0.48, inner / pageWidthPx))
      setScale(s)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [enabled, pageWidthPx])

  return { containerRef, scale }
}

export function AgentOpenInBuilderLink({
  attachment,
  className,
}: Readonly<{
  attachment: PageDocumentAttachment
  className?: string
}>) {
  if (attachment.kind === 'resume') {
    return (
      <Button asChild variant="outline" size="sm" className={cn('h-8 gap-1.5 text-xs', className)}>
        <Link to="/dashboard/resumes/$id/$step" params={{ id: attachment.id, step: 'preview' }}>
          Open in builder
        </Link>
      </Button>
    )
  }
  return (
    <Button asChild variant="outline" size="sm" className={cn('h-8 gap-1.5 text-xs', className)}>
      <Link to="/dashboard/cover-letters/$id/$step" params={{ id: attachment.id, step: 'preview' }}>
        Open in builder
      </Link>
    </Button>
  )
}

export function AgentDashboardDocumentPreview({
  attachment,
  density,
  className,
}: Readonly<{
  attachment: PageDocumentAttachment
  /** Narrow side panel vs wider dialog — controls preview scale. */
  density: 'panel' | 'dialog'
  className?: string
}>) {
  const dialogScale = 0.56

  const resumeQuery = useQuery({
    ...resumeDetailQueryOptions(attachment.id),
    enabled: attachment.kind === 'resume',
  })
  const letterQuery = useQuery({
    ...coverLetterDetailQueryOptions(attachment.id),
    enabled: attachment.kind === 'coverLetter',
  })

  const resumePageSizePx = useMemo(
    () =>
      resumePageSizePxForDoc(
        attachment.kind === 'resume' ? resumeQuery.data?.data : undefined,
      ),
    [attachment.kind, resumeQuery.data?.data],
  )

  const resumePanel = useFitPageScale(
    resumePageSizePx.width,
    density === 'panel' && attachment.kind === 'resume',
  )
  const letterPanel = useFitPageScale(
    COVER_LETTER_PAGE_WIDTH_PX,
    density === 'panel' && attachment.kind === 'coverLetter',
  )

  if (attachment.kind === 'resume') {
    if (resumeQuery.isPending) {
      return (
        <div className={cn('flex flex-1 items-center justify-center py-16', className)}>
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        </div>
      )
    }
    if (resumeQuery.isError || !resumeQuery.data) {
      return (
        <p className={cn('px-2 py-8 text-center text-xs text-destructive', className)}>
          Could not load this resume.
        </p>
      )
    }
    const doc = normalizeResumeDocument(cloneResumeDocument(resumeQuery.data.data))
    const scale = density === 'panel' ? resumePanel.scale : dialogScale
    const measureRef = density === 'panel' ? resumePanel.containerRef : undefined
    return (
      <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-auto', className)}>
        <div
          ref={measureRef}
          className={cn(
            'box-border flex w-full min-w-0 justify-center px-2 py-2 sm:px-3',
            density === 'panel' && 'min-h-0 flex-1',
          )}
        >
          {/*
            Use zoom (same as resume preview step), not transform+fixed height:
            a fixed pageH*scale box clips multi-page and long single-page resumes.
          */}
          <div
            className="inline-block max-w-full overflow-hidden rounded-lg border border-border/40 bg-white shadow-sm"
            style={{ zoom: scale } as CSSProperties}
          >
            <ResumeRenderer resume={doc} mode="preview" />
          </div>
        </div>
      </div>
    )
  }

  if (letterQuery.isPending) {
    return (
      <div className={cn('flex flex-1 items-center justify-center py-16', className)}>
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    )
  }
  if (letterQuery.isError || !letterQuery.data) {
    return (
      <p className={cn('px-2 py-8 text-center text-xs text-destructive', className)}>
        Could not load this cover letter.
      </p>
    )
  }
  const letterDoc = normalizeCoverLetterDocument(cloneCoverLetterDocument(letterQuery.data.data))
  const scale = density === 'panel' ? letterPanel.scale : dialogScale
  const measureRef = density === 'panel' ? letterPanel.containerRef : undefined
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-auto', className)}>
      <div
        ref={measureRef}
        className={cn(
          'box-border flex w-full min-w-0 justify-center px-2 py-2 sm:px-3',
          density === 'panel' && 'min-h-0 flex-1',
        )}
      >
        <div
          className="inline-block max-w-full overflow-hidden rounded-lg border border-border/40 bg-white shadow-sm"
          style={{ zoom: scale } as CSSProperties}
        >
          <CoverLetterRenderer coverLetter={letterDoc} mode="preview" />
        </div>
      </div>
    </div>
  )
}
