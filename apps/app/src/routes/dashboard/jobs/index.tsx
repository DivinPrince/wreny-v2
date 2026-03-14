import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { JobTrackerPage } from "#/features/jobs/components/job-tracker-page"
import { jobKeys, listJobs } from "#/features/jobs/lib/queries"

export const Route = createFileRoute('/dashboard/jobs/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: jobKeys.all,
    queryFn: listJobs,
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-16 animate-pulse rounded-lg bg-muted/30" />
        <div className="flex gap-2 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-96 min-w-[280px] animate-pulse rounded-lg bg-muted/30"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load your jobs. Please refresh and try again.
        </div>
      </div>
    )
  }

  return <JobTrackerPage jobs={jobs ?? []} />
}
