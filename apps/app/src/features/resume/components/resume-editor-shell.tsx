import type { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

import { cn } from '#/lib/utils'

const editSteps = [
  { id: 'contact', label: 'Contact' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'summary', label: 'Summary' },
] as const

const editorSteps = [
  ...editSteps,
  { id: 'preview', label: 'Preview' },
] as const

export type ResumeEditorStep = (typeof editorSteps)[number]['id']

export function isResumeEditorStep(value: string): value is ResumeEditorStep {
  return editorSteps.some((step) => step.id === value)
}

function getStepFromPathname(pathname: string) {
  const step = pathname.split('/').filter(Boolean).at(-1) ?? 'contact'
  return isResumeEditorStep(step) ? step : 'contact'
}

export function ResumeEditorShell({
  resumeId,
  title,
  children,
}: Readonly<{
  resumeId: string
  title: string
  children: ReactNode
}>) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const currentStep = getStepFromPathname(pathname)

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {/* Connected edit steps */}
            <div
              role="tablist"
              className="inline-flex rounded-xl border border-input bg-muted/50 p-1"
            >
              {editSteps.map((step) => (
                <Link
                  key={step.id}
                  to="/dashboard/resumes/$id/$step"
                  params={{ id: resumeId, step: step.id }}
                  role="tab"
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    currentStep === step.id
                      ? 'bg-background text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {step.label}
                </Link>
              ))}
            </div>

            {/* Separator */}
            <div
              aria-hidden
              className="h-8 w-px shrink-0 bg-border"
            />

            {/* Preview tab */}
            <Link
              to="/dashboard/resumes/$id/$step"
              params={{ id: resumeId, step: 'preview' }}
              role="tab"
              className={cn(
                'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                currentStep === 'preview'
                  ? 'border-input bg-background text-foreground'
                  : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )}
            >
              Preview
            </Link>
          </nav>
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
