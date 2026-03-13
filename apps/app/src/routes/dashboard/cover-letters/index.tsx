import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { Button } from "#/components/ui/button"
import { useSession } from "#/lib/auth-client"
import { AuthRequiredState } from "#/features/dashboard/components/AuthRequiredState"
import { CoverLetterCard } from "#/features/dashboard/components/CoverLetterCard"
import { DashboardShell } from "#/features/dashboard/components/DashboardShell"
import {
  coverLettersQueryOptions,
  createCoverLetter,
  dashboardKeys,
  deleteCoverLetter,
  sampleCoverLetter,
} from "#/features/dashboard/lib/queries"

export const Route = createFileRoute("/dashboard/cover-letters/")({
  component: CoverLettersIndexRoute,
})

function CoverLettersIndexRoute() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const coverLettersQuery = useQuery({
    ...coverLettersQueryOptions(),
    enabled: Boolean(session?.user),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createCoverLetter({
        title: "Untitled Cover Letter",
        data: structuredClone(sampleCoverLetter),
      }),
    onSuccess: async (coverLetter) => {
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.coverLetters })
      void navigate({
        to: "/dashboard/cover-letters/$id",
        params: { id: coverLetter.id },
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCoverLetter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.coverLetters })
    },
  })

  if (!session?.user) {
    return (
      <DashboardShell
        title="Cover Letters"
        description="Create and manage tailored cover letters."
      >
        <AuthRequiredState />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Cover Letters"
      description="Create and manage your cover letter library with the same dashboard card system."
      actions={
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          Create Cover Letter
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {coverLettersQuery.data?.map((coverLetter) => (
          <CoverLetterCard
            key={coverLetter.id}
            coverLetter={coverLetter}
            onDelete={(coverLetterId) => deleteMutation.mutate(coverLetterId)}
          />
        ))}
      </div>
    </DashboardShell>
  )
}
