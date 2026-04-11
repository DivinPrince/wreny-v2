import type { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Check, ChevronDown } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'

import {
  isPrimaryResumeStep,
  isResumeEditorStep,
  primaryResumeStepIds,
  resumeContentStepDefinitions,
} from './resume-editor-steps'

export type { ResumeEditorStep } from './resume-editor-steps'
export { isResumeEditorStep } from './resume-editor-steps'

function getStepFromPathname(pathname: string) {
  const step = pathname.split('/').filter(Boolean).at(-1) ?? 'contact'
  return isResumeEditorStep(step) ? step : 'contact'
}

export function ResumeEditorShell({
  resumeId,
  children,
}: Readonly<{
  resumeId: string
  children: ReactNode
}>) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const currentStep = getStepFromPathname(pathname)

  const primarySteps = resumeContentStepDefinitions.filter((step) =>
    (primaryResumeStepIds as readonly string[]).includes(step.id),
  )

  const overflowSteps = resumeContentStepDefinitions.filter(
    (step) => !(primaryResumeStepIds as readonly string[]).includes(step.id),
  )

  const showPromoted =
    currentStep !== 'preview' && !isPrimaryResumeStep(currentStep)

  const promoted = showPromoted
    ? resumeContentStepDefinitions.find((s) => s.id === currentStep)
    : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Link
            to="/dashboard/resumes"
            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to resumes
          </Link>

          <nav className="flex min-w-0 flex-wrap items-center gap-2">
            <div
              role="tablist"
              className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-1 rounded-xl border border-input bg-muted/50 p-1 sm:flex-nowrap"
            >
              {primarySteps.map((step) => (
                <Link
                  key={step.id}
                  to="/dashboard/resumes/$id/$step"
                  params={{ id: resumeId, step: step.id }}
                  role="tab"
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    currentStep === step.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {step.label}
                </Link>
              ))}

              {promoted ? (
                <Link
                  key={promoted.id}
                  to="/dashboard/resumes/$id/$step"
                  params={{ id: resumeId, step: promoted.id }}
                  role="tab"
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    currentStep === promoted.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {promoted.label}
                </Link>
              ) : null}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 shrink-0 gap-1 rounded-lg px-3 text-sm font-medium',
                      overflowSteps.some((s) => s.id === currentStep)
                        ? 'bg-background/80 text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    More
                    <ChevronDown className="size-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[200px]">
                  {overflowSteps.map((step) => (
                    <DropdownMenuItem key={step.id} asChild>
                      <Link
                        to="/dashboard/resumes/$id/$step"
                        params={{ id: resumeId, step: step.id }}
                        className="flex cursor-pointer items-center justify-between gap-2"
                      >
                        <span>{step.label}</span>
                        {currentStep === step.id ? (
                          <Check className="size-4 shrink-0 opacity-70" />
                        ) : null}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              aria-hidden
              className="hidden h-8 w-px shrink-0 bg-border sm:block"
            />

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
