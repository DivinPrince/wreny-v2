import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { useSession } from '#/lib/auth-client'

import { CreateNewResumeCard } from '#/features/resume/components/create-new-resume-card'
import { ResumePreviewCard } from '#/features/resume/components/resume-preview-card'
import { listResumes, resumeKeys, useCreateResume } from '#/features/resume/lib/queries'

export const Route = createFileRoute('/dashboard/resumes/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: resumes, isLoading, error } = useQuery({
    queryKey: resumeKeys.all,
    queryFn: listResumes,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground">Create and manage your resumes</p>
        </div>
        <CreateResumeButton />
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[320px] w-[230px] shrink-0 animate-pulse rounded-lg border bg-muted/30"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Failed to load resumes. Please try again.
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {(resumes ?? []).map((resume) => (
            <ResumePreviewCard key={resume.id} resume={resume} />
          ))}
          <CreateNewResumeCard />
        </div>
      )}
    </div>
  )
}

function CreateResumeButton() {
  const { data: session } = useSession()
  const createMutation = useCreateResume()

  return (
    <Button
      onClick={() => createMutation.mutate({ user: session?.user })}
      disabled={createMutation.isPending}
    >
      <Plus className="size-4" />
      Create Resume
    </Button>
  )
}
