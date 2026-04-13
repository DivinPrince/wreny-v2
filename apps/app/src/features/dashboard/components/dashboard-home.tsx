import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Check, ChevronRight } from 'lucide-react'

import { CoverLetterPreviewCard } from '#/features/cover-letter/components/cover-letter-preview-card'
import { CreateNewCoverLetterCard } from '#/features/cover-letter/components/create-new-cover-letter-card'
import { coverLetterKeys, listCoverLetters } from '#/features/cover-letter/lib/queries'
import { readDashboardOnboarding } from '#/features/dashboard/lib/onboarding-storage'
import { JobBoard } from '#/features/jobs/components/job-board'
import { jobKeys, listJobs } from '#/features/jobs/lib/queries'
import { CreateNewResumeCard } from '#/features/resume/components/create-new-resume-card'
import { ResumeFeatureCards } from '#/features/resume/components/resume-feature-cards'
import { ResumePreviewCard } from '#/features/resume/components/resume-preview-card'
import { resumeKeys, listResumes } from '#/features/resume/lib/queries'
import { useSession } from '#/lib/auth-client'
import { cn } from '#/lib/utils'

const RECENT_RESUME_COUNT = 3
const RECENT_COVER_LETTER_COUNT = 3

type WorkspaceTabId = 'resumes' | 'cover-letters' | 'jobs'

const WORKSPACE_TABS: { id: WorkspaceTabId; label: string }[] = [
  { id: 'resumes', label: 'Resumes' },
  { id: 'cover-letters', label: 'Cover letters' },
  { id: 'jobs', label: 'Job tracker' },
]

type ChecklistItem = {
  id: string
  title: string
  hint: string
  href: string
  done: boolean
}

function firstName(name: string | null | undefined) {
  const part = name?.trim().split(/\s+/)[0]
  return part || 'there'
}

function greetingLabel() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function sortByCreatedDesc<T extends { createdAt?: Date | string | null }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  )
}

export function DashboardHome() {
  const { data: session } = useSession()
  const [onboarding, setOnboarding] = useState(readDashboardOnboarding)
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabId>('resumes')

  useEffect(() => {
    const sync = () => setOnboarding(readDashboardOnboarding())
    window.addEventListener('wreny-dashboard-onboarding', sync)
    return () => window.removeEventListener('wreny-dashboard-onboarding', sync)
  }, [])

  const resumesQuery = useQuery({
    queryKey: resumeKeys.all,
    queryFn: listResumes,
  })
  const coverLettersQuery = useQuery({
    queryKey: coverLetterKeys.all,
    queryFn: listCoverLetters,
  })
  const jobsQuery = useQuery({
    queryKey: jobKeys.all,
    queryFn: listJobs,
  })

  const isLoading =
    resumesQuery.isLoading ||
    coverLettersQuery.isLoading ||
    jobsQuery.isLoading

  const resumeCount = resumesQuery.data?.length ?? 0
  const coverLetterCount = coverLettersQuery.data?.length ?? 0
  const jobCount = jobsQuery.data?.length ?? 0
  const triedAgent = onboarding.visitedAgent === true

  const recentResumes = useMemo(() => {
    if (!resumesQuery.data) return []
    return sortByCreatedDesc(resumesQuery.data).slice(0, RECENT_RESUME_COUNT)
  }, [resumesQuery.data])

  const recentCoverLetters = useMemo(() => {
    if (!coverLettersQuery.data) return []
    return sortByCreatedDesc(coverLettersQuery.data).slice(0, RECENT_COVER_LETTER_COUNT)
  }, [coverLettersQuery.data])

  const items = useMemo<ChecklistItem[]>(
    () => [
      {
        id: 'resume',
        title: 'Create your first resume',
        hint: 'Start fresh or bring in an existing file.',
        href: '/dashboard/resumes',
        done: resumeCount > 0,
      },
      {
        id: 'agent',
        title: 'Try the AI assistant',
        hint: 'Ask for rewrites, tailoring, and ideas.',
        href: '/dashboard/agent',
        done: triedAgent,
      },
      {
        id: 'cover',
        title: 'Draft a cover letter',
        hint: 'Match tone to the role in minutes.',
        href: '/dashboard/cover-letters',
        done: coverLetterCount > 0,
      },
      {
        id: 'jobs',
        title: 'Track an application',
        hint: 'Keep stages and follow-ups in one place.',
        href: '/dashboard/jobs',
        done: jobCount > 0,
      },
    ],
    [resumeCount, triedAgent, coverLetterCount, jobCount]
  )

  const doneCount = items.filter((i) => i.done).length

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-3 sm:gap-8 sm:p-6">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-md bg-muted/60" />
          <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-muted/40" />
        </div>
        <div className="h-52 animate-pulse rounded-xl border border-border/60 bg-muted/20" />
        <div className="h-28 animate-pulse rounded-xl border border-border/60 bg-muted/20" />
        <div>
          <div className="mb-3 flex gap-3 border-b border-border/60 pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded bg-muted/50" />
            ))}
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-96 min-w-[280px] shrink-0 animate-pulse rounded-lg bg-muted/40"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-3 sm:gap-8 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {greetingLabel()}, {firstName(session?.user?.name)}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          A calm place to build documents and stay organized—pick a step below or
          jump in with a quick import.
        </p>
      </div>

      <section
        className="rounded-xl border border-border/80 bg-muted/20 px-4 py-4 sm:px-5 sm:py-5"
        aria-labelledby="dashboard-getting-started"
      >
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 id="dashboard-getting-started" className="text-sm font-medium">
            Getting started
          </h2>
          <span className="tabular-nums text-xs text-muted-foreground">
            {doneCount}/{items.length}
          </span>
        </div>
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-background/80">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className={cn(
                  'flex items-start gap-3 px-3 py-3 transition-colors sm:px-4',
                  'hover:bg-muted/40',
                  item.done && 'bg-muted/10'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border',
                    item.done
                      ? 'border-primary/25 bg-primary/10 text-primary'
                      : 'border-muted-foreground/20 bg-background'
                  )}
                  aria-hidden
                >
                  {item.done ? (
                    <Check className="size-3.5 stroke-[2.5]" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-muted-foreground/35" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium leading-snug',
                      item.done && 'text-muted-foreground'
                    )}
                  >
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {item.hint}
                  </p>
                </div>
                <ChevronRight
                  className="mt-1 size-4 shrink-0 text-muted-foreground/50"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dashboard-quick-actions">
        <h2
          id="dashboard-quick-actions"
          className="mb-3 text-sm font-medium text-muted-foreground"
        >
          Quick actions
        </h2>
        <ResumeFeatureCards />
      </section>

      <section aria-label="Your workspace">
        <div
          className="flex flex-wrap items-end gap-1 border-b border-border/60"
          role="tablist"
          aria-label="Workspace sections"
        >
          {WORKSPACE_TABS.map((tab) => {
            const count =
              tab.id === 'resumes'
                ? resumeCount
                : tab.id === 'cover-letters'
                  ? coverLetterCount
                  : jobCount
            const selected = workspaceTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`workspace-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`workspace-panel-${tab.id}`}
                onClick={() => setWorkspaceTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-2 py-2 text-sm font-medium transition-colors sm:px-3',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  selected
                    ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'tabular-nums text-xs font-normal',
                    selected ? 'text-muted-foreground' : 'text-muted-foreground/80'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="min-h-0">
          <div
            id="workspace-panel-resumes"
            role="tabpanel"
            aria-labelledby="workspace-tab-resumes"
            hidden={workspaceTab !== 'resumes'}
            className="flex flex-col gap-2"
          >
            <div className="flex justify-end">
              <Link
                to="/dashboard/resumes"
                className="text-xs font-medium text-primary hover:underline"
              >
                See all resumes
              </Link>
            </div>
            {resumesQuery.isError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                Could not load resumes.{' '}
                <Link to="/dashboard/resumes" className="font-medium underline">
                  Try the resumes page
                </Link>
                .
              </div>
            ) : resumeCount === 0 && recentResumes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No resumes yet—create one from the card below or use a quick import above.
              </p>
            ) : (
              <div className="grid max-w-full grid-cols-2 justify-items-stretch gap-2 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:justify-items-center sm:gap-4">
                <CreateNewResumeCard />
                {recentResumes.map((resume) => (
                  <ResumePreviewCard key={resume.id} resume={resume} />
                ))}
              </div>
            )}
          </div>

          <div
            id="workspace-panel-cover-letters"
            role="tabpanel"
            aria-labelledby="workspace-tab-cover-letters"
            hidden={workspaceTab !== 'cover-letters'}
            className="flex flex-col gap-2"
          >
            <div className="flex justify-end">
              <Link
                to="/dashboard/cover-letters"
                className="text-xs font-medium text-primary hover:underline"
              >
                See all cover letters
              </Link>
            </div>
            {coverLettersQuery.isError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                Could not load cover letters.{' '}
                <Link to="/dashboard/cover-letters" className="font-medium underline">
                  Try the cover letters page
                </Link>
                .
              </div>
            ) : coverLetterCount === 0 && recentCoverLetters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No cover letters yet—start one from the card below when you are ready.
              </p>
            ) : (
              <div className="grid max-w-full grid-cols-2 justify-items-stretch gap-2 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:justify-items-center sm:gap-4">
                <CreateNewCoverLetterCard />
                {recentCoverLetters.map((coverLetter) => (
                  <CoverLetterPreviewCard key={coverLetter.id} coverLetter={coverLetter} />
                ))}
              </div>
            )}
          </div>

          <div
            id="workspace-panel-jobs"
            role="tabpanel"
            aria-labelledby="workspace-tab-jobs"
            hidden={workspaceTab !== 'jobs'}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Drag cards between columns; same board as the jobs page.
              </p>
              <Link
                to="/dashboard/jobs"
                className="shrink-0 text-xs font-medium text-primary hover:underline sm:text-end"
              >
                Open jobs page
              </Link>
            </div>
            {jobsQuery.isError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                Failed to load jobs. Please refresh or open the{' '}
                <Link to="/dashboard/jobs" className="font-medium underline">
                  job tracker
                </Link>
                .
              </div>
            ) : (
              <JobBoard jobs={jobsQuery.data ?? []} />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
