import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

import { CoverLetterFeatureCards } from '#/features/cover-letter/components/cover-letter-feature-cards'
import { CoverLetterPreviewCard } from '#/features/cover-letter/components/cover-letter-preview-card'
import { CreateNewCoverLetterCard } from '#/features/cover-letter/components/create-new-cover-letter-card'
import { CreateNewCoverLetterRow } from '#/features/cover-letter/components/create-new-cover-letter-row'
import { CoverLetterListRow } from '#/features/cover-letter/components/cover-letter-list-row'
import {
  coverLetterKeys,
  listCoverLetters,
} from '#/features/cover-letter/lib/queries'

type ViewMode = 'grid' | 'list'

export const Route = createFileRoute('/dashboard/cover-letters/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { data: coverLetters, isLoading, error } = useQuery({
    queryKey: coverLetterKeys.all,
    queryFn: listCoverLetters,
  })

  const sortedCoverLetters = [...(coverLetters ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  )

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-6">
      <CoverLetterFeatureCards />

      <div className="rounded-xl bg-muted/30 p-3 sm:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Cover Letters
          </h2>

          <div
            className="inline-flex w-fit shrink-0 overflow-hidden rounded-lg border bg-background max-sm:self-center"
            role="group"
            aria-label="Cover letter view mode"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                'rounded-none border-0 first:rounded-s-lg last:rounded-e-lg',
                viewMode === 'grid' && 'bg-muted'
              )}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                'rounded-none border-0 first:rounded-s-lg last:rounded-e-lg',
                viewMode === 'list' && 'bg-muted'
              )}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid max-w-full grid-cols-2 justify-items-stretch gap-2 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:justify-items-center sm:gap-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[340px] w-full shrink-0 animate-pulse rounded-lg border bg-muted/50 sm:w-[230px]"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-lg bg-muted/50"
                />
              ))}
            </div>
          )
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Failed to load cover letters. Please try again.
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-1 rounded-lg bg-background">
            <div className="hidden grid-cols-[auto_1fr_6rem_6rem_auto] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
              <span className="w-[56px]" />
              <span>Name</span>
              <span>Created</span>
              <span>Edited</span>
              <span className="w-9" />
            </div>
            <CreateNewCoverLetterRow />
            {sortedCoverLetters.map((coverLetter) => (
              <CoverLetterListRow
                key={coverLetter.id}
                coverLetter={coverLetter}
              />
            ))}
          </div>
        ) : (
          <div className="grid max-w-full grid-cols-2 justify-items-stretch gap-2 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:justify-items-center sm:gap-4">
            <CreateNewCoverLetterCard />
            {sortedCoverLetters.map((coverLetter) => (
              <CoverLetterPreviewCard
                key={coverLetter.id}
                coverLetter={coverLetter}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
