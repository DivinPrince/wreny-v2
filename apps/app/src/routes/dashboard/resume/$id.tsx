import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"

import { AuthRequiredState } from "#/features/dashboard/components/AuthRequiredState"
import { DashboardShell } from "#/features/dashboard/components/DashboardShell"
import {
  getResume,
  resumeKeys,
  updateResume,
} from "#/features/dashboard/lib/queries"
import { ResumeEditor } from "#/features/resume/components/ResumeEditor"
import { useSession } from "#/lib/auth-client"

export const Route = createFileRoute("/dashboard/resume/$id")({
  component: ResumeDetailRoute,
})

function ResumeDetailRoute() {
  const { id } = Route.useParams()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const resumeQuery = useQuery({
    queryKey: resumeKeys.detail(id),
    queryFn: () => getResume(id),
    enabled: Boolean(session?.user),
  })

  const updateResumeMutation = useMutation({
    mutationFn: (payload: { title: string; resume: Parameters<typeof updateResume>[1] }) =>
      updateResume(id, payload.resume, payload.title),
    onSuccess: async (resume) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: resumeKeys.all }),
        queryClient.invalidateQueries({ queryKey: resumeKeys.detail(resume.id) }),
      ])
    },
  })

  if (!session?.user) {
    return (
      <DashboardShell
        title="Resume Studio"
        description="Edit your resume with the same studio-style workflow."
      >
        <AuthRequiredState />
      </DashboardShell>
    )
  }

  if (!resumeQuery.data) {
    if (resumeQuery.isLoading) {
      return (
        <DashboardShell
          title="Resume Studio"
          description="Loading your resume document."
        >
          <div className="rounded-[1.5rem] border bg-background p-8 text-sm text-muted-foreground">
            Loading resume...
          </div>
        </DashboardShell>
      )
    }

    throw notFound()
  }

  return (
    <DashboardShell
      title={resumeQuery.data.title}
      description="Update content, switch templates, and preview changes live."
    >
      <ResumeEditor
        resumeId={resumeQuery.data.id}
        title={resumeQuery.data.title}
        initialResume={resumeQuery.data.data}
        canSave
        saving={updateResumeMutation.isPending}
        onSave={async (payload) => {
          await updateResumeMutation.mutateAsync(payload)
        }}
      />
    </DashboardShell>
  )
}
