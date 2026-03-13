import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"

import { useSession } from "#/lib/auth-client"
import { AuthRequiredState } from "#/features/dashboard/components/AuthRequiredState"
import { CoverLetterEditor } from "#/features/dashboard/components/CoverLetterEditor"
import { DashboardShell } from "#/features/dashboard/components/DashboardShell"
import {
  coverLetterDetailQueryOptions,
  dashboardKeys,
  updateCoverLetter,
} from "#/features/dashboard/lib/queries"

export const Route = createFileRoute("/dashboard/cover-letters/$id")({
  component: CoverLetterDetailRoute,
})

function CoverLetterDetailRoute() {
  const { id } = Route.useParams()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const coverLetterQuery = useQuery({
    ...coverLetterDetailQueryOptions(id),
    enabled: Boolean(session?.user),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: {
      title: string
      data: Parameters<typeof updateCoverLetter>[1]["data"]
    }) => updateCoverLetter(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dashboardKeys.coverLetters }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.coverLetterDetail(id) }),
      ])
    },
  })

  if (!session?.user) {
    return (
      <DashboardShell
        title="Cover Letter Studio"
        description="Edit your cover letters with a structured writer and preview."
      >
        <AuthRequiredState />
      </DashboardShell>
    )
  }

  if (!coverLetterQuery.data) {
    if (coverLetterQuery.isLoading) {
      return (
        <DashboardShell
          title="Cover Letter Studio"
          description="Loading your cover letter."
        >
          <div className="rounded-[1.5rem] border bg-background p-8 text-sm text-muted-foreground">
            Loading cover letter...
          </div>
        </DashboardShell>
      )
    }

    throw notFound()
  }

  return (
    <DashboardShell
      title={coverLetterQuery.data.title}
      description="Use a two-pane editor with a live preview, similar to the original product flow."
    >
      <CoverLetterEditor
        title={coverLetterQuery.data.title}
        initialValue={coverLetterQuery.data.data}
        saving={updateMutation.isPending}
        onSave={async (payload) => {
          await updateMutation.mutateAsync(payload)
        }}
      />
    </DashboardShell>
  )
}
