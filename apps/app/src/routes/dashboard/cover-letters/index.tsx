import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { useSession } from '#/lib/auth-client'
import { CoverLetterPreviewCard } from '#/features/cover-letter/components/cover-letter-preview-card'
import { CreateNewCoverLetterCard } from '#/features/cover-letter/components/create-new-cover-letter-card'
import {
  coverLetterKeys,
  listCoverLetters,
  useCreateCoverLetter,
} from '#/features/cover-letter/lib/queries'

export const Route = createFileRoute('/dashboard/cover-letters/')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    data: coverLetters,
    isLoading,
    error,
  } = useQuery({
    queryKey: coverLetterKeys.all,
    queryFn: listCoverLetters,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cover Letters</h1>
          <p className="text-muted-foreground">
            Create tailored cover letters and export polished PDFs.
          </p>
        </div>
        <CreateCoverLetterButton />
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-[340px] w-[250px] shrink-0 animate-pulse rounded-lg border bg-muted/30"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Failed to load cover letters. Please try again.
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {(coverLetters ?? []).map((coverLetter) => (
            <CoverLetterPreviewCard
              key={coverLetter.id}
              coverLetter={coverLetter}
            />
          ))}
          <CreateNewCoverLetterCard />
        </div>
      )}
    </div>
  )
}

function CreateCoverLetterButton() {
  const { data: session } = useSession()
  const createMutation = useCreateCoverLetter()

  return (
    <Button
      onClick={() => createMutation.mutate({ user: session?.user })}
      disabled={createMutation.isPending}
    >
      <Plus className="size-4" />
      Create Cover Letter
    </Button>
  )
}
