import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { Button } from "#/components/ui/button"
import { useSession } from "#/lib/auth-client"
import { AuthRequiredState } from "#/features/dashboard/components/AuthRequiredState"
import { DashboardShell } from "#/features/dashboard/components/DashboardShell"
import { ResumeCard } from "#/features/dashboard/components/ResumeCard"
import { buildBlankResume, createResume, listResumes, resumeKeys } from "#/features/dashboard/lib/queries"

export const Route = createFileRoute("/dashboard/resume/")({
  component: ResumeIndexRoute,
})

function ResumeIndexRoute() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const resumesQuery = useQuery({
    queryKey: resumeKeys.all,
    queryFn: listResumes,
    enabled: Boolean(session?.user),
  })

  const createResumeMutation = useMutation({
    mutationFn: () =>
      createResume({
        title: "Untitled Resume",
        data: buildBlankResume(),
      }),
    onSuccess: async (resume) => {
      await queryClient.invalidateQueries({ queryKey: resumeKeys.all })
      void navigate({ to: "/dashboard/resume/$id", params: { id: resume.id } })
    },
  })

  if (!session?.user) {
    return (
      <DashboardShell
        title="Resumes"
        description="Create and manage your resume library."
      >
        <AuthRequiredState />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Resumes"
      description="Create and manage your resumes in the same dashboard structure as the source app."
      actions={
        <Button onClick={() => createResumeMutation.mutate()} disabled={createResumeMutation.isPending}>
          Create Resume
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {resumesQuery.data?.map((resume) => <ResumeCard key={resume.id} resume={resume} />)}
      </div>
    </DashboardShell>
  )
}
