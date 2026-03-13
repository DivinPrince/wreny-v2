import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { Button } from "#/components/ui/button"
import { useSession } from "#/lib/auth-client"
import { AuthRequiredState } from "#/features/dashboard/components/AuthRequiredState"
import { DashboardShell } from "#/features/dashboard/components/DashboardShell"
import { JobBoard } from "#/features/dashboard/components/JobBoard"
import { type JobStatus } from "#/features/dashboard/lib/job-status"
import {
  createJob,
  dashboardKeys,
  jobsQueryOptions,
  updateJob,
} from "#/features/dashboard/lib/queries"

export const Route = createFileRoute("/dashboard/jobs/")({
  component: JobsIndexRoute,
})

function JobsIndexRoute() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const jobsQuery = useQuery({
    ...jobsQueryOptions(),
    enabled: Boolean(session?.user),
  })

  const createJobMutation = useMutation({
    mutationFn: (status: JobStatus) =>
      createJob({
        status,
        companyName: "New Company",
        jobTitle: "New Role",
        documents: [],
        jobDescription: "",
        jobUrl: "",
        salary: "",
        position: 1000,
        notes: "",
        companyLogoUrl: "",
        logoColor: "#0f172a",
        location: "",
      }),
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.jobs })
      void navigate({ to: "/dashboard/jobs/$id", params: { id: job.id } })
    },
  })

  const moveJobMutation = useMutation({
    mutationFn: ({
      jobId,
      status,
      position,
    }: {
      jobId: string
      status: JobStatus
      position: number
    }) => updateJob(jobId, { status, position }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.jobs })
    },
  })

  if (!session?.user) {
    return (
      <DashboardShell
        title="Job Tracker"
        description="Track applications, interviews, offers, and rejections."
      >
        <AuthRequiredState />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Job Tracker"
      description="Track your job applications, interviews, and offers in a kanban workflow."
      actions={
        <Button onClick={() => createJobMutation.mutate("shortlist")}>
          Add Job
        </Button>
      }
    >
      <JobBoard
        jobs={jobsQuery.data ?? []}
        onCreateJob={(status) => createJobMutation.mutate(status)}
        onMoveJob={(jobId, status, position) =>
          moveJobMutation.mutate({ jobId, status, position })
        }
      />
    </DashboardShell>
  )
}
