import { createFileRoute, redirect } from '@tanstack/react-router'
import { createStandardSchemaV1, parseAsString } from 'nuqs'

import { ContactStep } from '#/features/resume/components/steps/contact-step'
import { EducationStep } from '#/features/resume/components/steps/education-step'
import { ExperienceStep } from '#/features/resume/components/steps/experience-step'
import { PreviewStep } from '#/features/resume/components/steps/preview-step'
import { SkillsStep } from '#/features/resume/components/steps/skills-step'
import { SummaryStep } from '#/features/resume/components/steps/summary-step'
import {
  isResumeEditorStep,
  type ResumeEditorStep,
} from '#/features/resume/components/resume-editor-shell'

export const Route = createFileRoute('/dashboard/resumes/$id/$step')({
  validateSearch: createStandardSchemaV1({
    sessionId: parseAsString,
  }, {
    partialOutput: true,
  }),
  beforeLoad: ({ params, search }) => {
    if (!isResumeEditorStep(params.step)) {
      throw redirect({
        to: '/dashboard/resumes/$id/$step',
        params: {
          id: params.id,
          step: 'contact',
        },
      })
    }

    if (params.step !== 'preview' && search.sessionId) {
      throw redirect({
        to: '/dashboard/resumes/$id/$step',
        params,
        search: () => ({}),
        replace: true,
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { step } = Route.useParams()
  const currentStep: ResumeEditorStep = isResumeEditorStep(step) ? step : 'contact'

  switch (currentStep) {
    case 'contact':
      return <ContactStep />
    case 'experience':
      return <ExperienceStep />
    case 'education':
      return <EducationStep />
    case 'skills':
      return <SkillsStep />
    case 'summary':
      return <SummaryStep />
    case 'preview':
      return <PreviewStep />
    default:
      return <ContactStep />
  }
}
