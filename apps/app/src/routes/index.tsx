import { LandingLayout } from '#/components/landing/landing-layout'
import { StartPage } from '#/components/landing/start-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title:
          'Free Resume Builder - Optimize your job search with AI-powered resumes and cover letters',
      },
      {
        name: 'description',
        content:
          'Create ATS-optimized resumes, personalized cover letters, and track your job applications with our AI assistant that matches your skills to exactly what employers are looking for.',
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
