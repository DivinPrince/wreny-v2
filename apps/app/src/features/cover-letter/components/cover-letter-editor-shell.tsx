import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { cn } from '#/lib/utils'

const editorSteps = ['sender', 'recipient', 'content', 'preview'] as const

export type CoverLetterEditorStep = (typeof editorSteps)[number]

export function isCoverLetterEditorStep(
  value: string,
): value is CoverLetterEditorStep {
  return editorSteps.includes(value as CoverLetterEditorStep)
}

export function CoverLetterEditorShell({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Link
            to="/dashboard/cover-letters"
            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to cover letters
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}

export function StepPanel({
  children,
  className,
}: Readonly<{
  children: ReactNode
  className?: string
}>) {
  return (
    <div
      className={cn(
        'flex min-h-[calc(100vh-12rem)] flex-1 flex-col rounded-2xl border bg-background p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
