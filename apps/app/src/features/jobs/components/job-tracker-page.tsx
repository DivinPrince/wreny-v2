import type { JobInfo } from "../lib/types"

import { JobBoard } from "./job-board"

type JobTrackerPageProps = {
  jobs: JobInfo[]
}

export function JobTrackerPage({ jobs }: JobTrackerPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Job Tracker</h1>
        <p className="text-muted-foreground">
          Track your job applications, interviews, and offers in one organized
          dashboard. Never miss an opportunity again.
        </p>
      </div>

      <JobBoard jobs={jobs} />
    </div>
  )
}
