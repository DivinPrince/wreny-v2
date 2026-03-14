import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ResumeRenderer } from '#/features/resume/rendering/resume-renderer'
import {
  normalizeResumeDocument,
  resumeDetailQueryOptions,
} from '#/features/resume/lib/queries'

export const Route = createFileRoute('/resume-pdf/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: resumeInfo, isLoading, error } = useQuery(
    resumeDetailQueryOptions(id),
  )

  if (isLoading) {
    return (
      <div className="resume-pdf-route flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !resumeInfo) {
    return (
      <div className="resume-pdf-route flex min-h-screen items-center justify-center p-6">
        <div className="rounded-2xl border bg-background p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Unable to load resume PDF</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="resume-pdf-route">
      <div className="resume-pdf-frame">
        <ResumeRenderer
          resume={normalizeResumeDocument(resumeInfo.data)}
        />
      </div>
    </div>
  )
}
