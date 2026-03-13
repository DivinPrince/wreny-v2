import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { useSession } from "#/lib/auth-client"
import { Button } from "#/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#/components/ui/tabs"
import { DashboardShell } from "#/features/dashboard/components/DashboardShell"
import { AuthRequiredState } from "#/features/dashboard/components/AuthRequiredState"
import { ResumeCard } from "#/features/dashboard/components/ResumeCard"
import { CoverLetterCard } from "#/features/dashboard/components/CoverLetterCard"
import { JobBoard } from "#/features/dashboard/components/JobBoard"
import {
  buildBlankResume,
  coverLettersQueryOptions,
  createCoverLetter,
  createJob,
  createResume,
  dashboardKeys,
  deleteCoverLetter,
  jobsQueryOptions,
  listResumes,
  resumeKeys,
  sampleCoverLetter,
  updateJob,
} from "#/features/dashboard/lib/queries"
import { type JobStatus, jobStatusMeta } from "#/features/dashboard/lib/job-status"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardRoute,
})

function DashboardRoute() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const resumesQuery = useQuery({
    queryKey: resumeKeys.all,
    queryFn: listResumes,
    enabled: Boolean(session?.user),
  })
  const coverLettersQuery = useQuery({
    ...coverLettersQueryOptions(),
    enabled: Boolean(session?.user),
  })
  const jobsQuery = useQuery({
    ...jobsQueryOptions(),
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

  const createCoverLetterMutation = useMutation({
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

  const deleteCoverLetterMutation = useMutation({
    mutationFn: deleteCoverLetter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.coverLetters })
    },
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
        title="Welcome to Wreny"
        description="Your workspace for resumes, cover letters, and job tracking."
      >
        <AuthRequiredState />
      </DashboardShell>
    )
  }

  const resumeCount = resumesQuery.data?.length ?? 0
  const coverLetterCount = coverLettersQuery.data?.length ?? 0
  const jobCount = jobsQuery.data?.length ?? 0
  const latestJobStatus =
    jobsQuery.data && jobsQuery.data.length > 0 ? jobStatusMeta[jobsQuery.data[0].status].label : "No jobs yet"

  return (
    <DashboardShell
      title={`Welcome back, ${session.user.name ?? "there"}!`}
      description="Manage resumes, cover letters, and your job tracker from one dashboard."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[1.5rem] bg-background">
          <CardHeader>
            <CardTitle>Resumes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{resumeCount}</p>
            <p className="text-sm text-muted-foreground">Saved resume documents</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] bg-background">
          <CardHeader>
            <CardTitle>Cover letters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{coverLetterCount}</p>
            <p className="text-sm text-muted-foreground">Reusable job-specific drafts</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] bg-background">
          <CardHeader>
            <CardTitle>Job tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{jobCount}</p>
            <p className="text-sm text-muted-foreground">Latest status: {latestJobStatus}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumes" className="mt-6 w-full">
        <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0">
          <TabsTrigger
            value="resumes"
            className="relative rounded-none px-0 py-3 text-base data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Resumes
          </TabsTrigger>
          <TabsTrigger
            value="cover-letters"
            className="relative rounded-none px-4 py-3 text-base data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Cover Letters
          </TabsTrigger>
          <TabsTrigger
            value="job-tracker"
            className="relative rounded-none px-4 py-3 text-base data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Job Tracker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumes" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => createResumeMutation.mutate()} disabled={createResumeMutation.isPending}>
              Create Resume
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {resumesQuery.data?.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cover-letters" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => createCoverLetterMutation.mutate()}
              disabled={createCoverLetterMutation.isPending}
            >
              Create Cover Letter
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {coverLettersQuery.data?.map((coverLetter) => (
              <CoverLetterCard
                key={coverLetter.id}
                coverLetter={coverLetter}
                onDelete={(coverLetterId) => deleteCoverLetterMutation.mutate(coverLetterId)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="job-tracker" className="mt-6">
          <JobBoard
            jobs={jobsQuery.data ?? []}
            onCreateJob={(status) => createJobMutation.mutate(status)}
            onMoveJob={(jobId, status, position) =>
              moveJobMutation.mutate({ jobId, status, position })
            }
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
