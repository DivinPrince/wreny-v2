import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '#/lib/utils'

type DocumentScanningOverlayProps = {
  open: boolean
  className?: string
}

/**
 * Full-viewport overlay for PDF import — vertical content scan on a white document card.
 * @see https://animata.design/docs/feature-cards/content-scan
 */
export function DocumentScanningOverlay({
  open,
  className,
}: DocumentScanningOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !open) return null

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center bg-background/25',
        className
      )}
    >
      <span className="sr-only">Importing PDF</span>
      <div
        className={cn(
          'relative h-64 w-48 overflow-hidden rounded-lg bg-white shadow-md sm:h-72 sm:w-56'
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-5 top-7 space-y-2"
          aria-hidden
        >
          <div className="h-1.5 w-[55%] rounded-sm bg-neutral-200" />
          <div className="h-1.5 w-full rounded-sm bg-neutral-200" />
          <div className="h-1.5 w-[92%] rounded-sm bg-neutral-200" />
          <div className="h-1.5 w-full rounded-sm bg-neutral-200" />
          <div className="h-1.5 w-[70%] rounded-sm bg-neutral-200" />
          <div className="pt-3" />
          <div className="h-1.5 w-full rounded-sm bg-neutral-200" />
          <div className="h-1.5 w-[88%] rounded-sm bg-neutral-200" />
          <div className="h-1.5 w-full rounded-sm bg-neutral-200" />
          <div className="h-1.5 w-[40%] rounded-sm bg-neutral-200" />
        </div>
        <div className="document-scan-sweep" aria-hidden>
          <div className="document-scan-sweep-bar" />
          <div className="document-scan-sweep-fade" />
        </div>
      </div>
    </div>,
    document.body
  )
}
