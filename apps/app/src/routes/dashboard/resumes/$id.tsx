import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { ResumeEditorProvider } from '#/features/resume/components/resume-editor-context'
import { ResumeEditorShell } from '#/features/resume/components/resume-editor-shell'
import { resumeDetailQueryOptions } from '#/features/resume/lib/queries'

export const Route = createFileRoute('/dashboard/resumes/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: resumeInfo, isLoading, error } = useQuery(resumeDetailQueryOptions(id))

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/20 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !resumeInfo) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/20 p-6">
        <div className="max-w-md rounded-2xl border border-destructive/20 bg-background p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Unable to load this resume</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Try going back to the resumes list and opening it again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ResumeEditorProvider resumeInfo={resumeInfo}>
      <ResumeEditorShell resumeId={resumeInfo.id} title={resumeInfo.title}>
        <Outlet />
      </ResumeEditorShell>
    </ResumeEditorProvider>
  )
}
