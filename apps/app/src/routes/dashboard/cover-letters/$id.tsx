import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { CoverLetterEditorProvider } from '#/features/cover-letter/components/cover-letter-editor-context'
import { CoverLetterEditorShell } from '#/features/cover-letter/components/cover-letter-editor-shell'
import { coverLetterDetailQueryOptions } from '#/features/cover-letter/lib/queries'

export const Route = createFileRoute('/dashboard/cover-letters/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const {
    data: coverLetterInfo,
    isLoading,
    error,
  } = useQuery(coverLetterDetailQueryOptions(id))

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/20 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !coverLetterInfo) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/20 p-6">
        <div className="max-w-md rounded-2xl border border-destructive/20 bg-background p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">
            Unable to load this cover letter
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Try going back to the cover-letter list and opening it again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <CoverLetterEditorProvider coverLetterInfo={coverLetterInfo}>
      <CoverLetterEditorShell>
        <Outlet />
      </CoverLetterEditorShell>
    </CoverLetterEditorProvider>
  )
}
