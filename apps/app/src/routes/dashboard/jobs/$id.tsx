import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"

import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { useSession } from "#/lib/auth-client"
import { AuthRequiredState } from "#/features/dashboard/components/AuthRequiredState"
import { DashboardShell } from "#/features/dashboard/components/DashboardShell"
import { jobStatusMeta, jobStatusOrder } from "#/features/dashboard/lib/job-status"
import { dashboardKeys, jobDetailQueryOptions, updateJob } from "#/features/dashboard/lib/queries"

export const Route = createFileRoute("/dashboard/jobs/$id")({
  component: JobDetailRoute,
})

function JobDetailRoute() {
  const { id } = Route.useParams()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const jobQuery = useQuery({
    ...jobDetailQueryOptions(id),
    enabled: Boolean(session?.user),
  })

  const updateMutation = useMutation({
    mutationFn: updateJob.bind(null, id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dashboardKeys.jobs }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.jobDetail(id) }),
      ])
    },
  })

  if (!session?.user) {
    return (
      <DashboardShell
        title="Job Details"
        description="Review and update your tracked application."
      >
        <AuthRequiredState />
      </DashboardShell>
    )
  }

  if (!jobQuery.data) {
    if (jobQuery.isLoading) {
      return (
        <DashboardShell title="Job Details" description="Loading job application details.">
          <div className="rounded-[1.5rem] border bg-background p-8 text-sm text-muted-foreground">
            Loading job...
          </div>
        </DashboardShell>
      )
    }

    throw notFound()
  }

  const job = jobQuery.data

  return (
    <DashboardShell
      title={job.companyName}
      description="Update status, notes, and employer details from a focused editor."
    >
      <Card className="rounded-[1.75rem] bg-background">
        <CardHeader>
          <CardTitle className="text-2xl">Application details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company name</Label>
              <Input
                id="company-name"
                defaultValue={job.companyName}
                onBlur={(event) => updateMutation.mutate({ companyName: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-title">Role</Label>
              <Input
                id="job-title"
                defaultValue={job.jobTitle}
                onBlur={(event) => updateMutation.mutate({ jobTitle: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                defaultValue={job.location ?? ""}
                onBlur={(event) => updateMutation.mutate({ location: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                defaultValue={job.salary ?? ""}
                onBlur={(event) => updateMutation.mutate({ salary: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {jobStatusOrder.map((status) => {
                const meta = jobStatusMeta[status]
                return (
                  <Button
                    key={status}
                    variant={job.status === status ? "default" : "outline"}
                    onClick={() => updateMutation.mutate({ status })}
                  >
                    {meta.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="job-url">Job URL</Label>
            <Input
              id="job-url"
              defaultValue={job.jobUrl ?? ""}
              onBlur={(event) => updateMutation.mutate({ jobUrl: event.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="job-description">Job description</Label>
            <Textarea
              id="job-description"
              rows={8}
              defaultValue={job.jobDescription ?? ""}
              onBlur={(event) => updateMutation.mutate({ jobDescription: event.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={6}
              defaultValue={job.notes ?? ""}
              onBlur={(event) => updateMutation.mutate({ notes: event.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
