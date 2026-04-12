import { LandingLayout } from '#/components/landing/landing-layout'
import { StartPage } from '#/components/landing/start-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: 'Wreny — Resumes, cover letters, and job tracking in one app',
      },
      {
        name: 'description',
        content:
          'Tailor your resume and cover letter to each role, export a clean PDF, and track applications without spreadsheets. Start free.',
      },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <LandingLayout>
      <StartPage />
    </LandingLayout>
  )
}
