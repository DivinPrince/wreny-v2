import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { CoverLetterRenderer } from '#/features/cover-letter/rendering/cover-letter-renderer'
import {
  coverLetterDetailQueryOptions,
  normalizeCoverLetterDocument,
} from '#/features/cover-letter/lib/queries'

export const Route = createFileRoute('/cover-letter-pdf/$id')({
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
      <div className="cover-letter-pdf-route flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !coverLetterInfo) {
    return (
      <div className="cover-letter-pdf-route flex min-h-screen items-center justify-center p-6">
        <div className="rounded-2xl border bg-background p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">
            Unable to load cover letter PDF
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="cover-letter-pdf-route">
      <div className="cover-letter-pdf-frame">
        <CoverLetterRenderer
          coverLetter={normalizeCoverLetterDocument(coverLetterInfo.data)}
        />
      </div>
    </div>
  )
}
