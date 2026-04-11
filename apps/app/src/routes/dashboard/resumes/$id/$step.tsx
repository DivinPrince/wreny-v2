import { createFileRoute, redirect } from '@tanstack/react-router'
import { createStandardSchemaV1, parseAsString } from 'nuqs'

import { AwardsStep } from '#/features/resume/components/steps/awards-step'
import { CertificationsStep } from '#/features/resume/components/steps/certifications-step'
import { ContactStep } from '#/features/resume/components/steps/contact-step'
import { CustomSectionsStep } from '#/features/resume/components/steps/custom-sections-step'
import { DocumentStep } from '#/features/resume/components/steps/document-step'
import { EducationStep } from '#/features/resume/components/steps/education-step'
import { ExperienceStep } from '#/features/resume/components/steps/experience-step'
import { InterestsStep } from '#/features/resume/components/steps/interests-step'
import { LanguagesStep } from '#/features/resume/components/steps/languages-step'
import { PreviewStep } from '#/features/resume/components/steps/preview-step'
import { ProjectsStep } from '#/features/resume/components/steps/projects-step'
import { PublicationsStep } from '#/features/resume/components/steps/publications-step'
import { ReferencesStep } from '#/features/resume/components/steps/references-step'
import { SkillsStep } from '#/features/resume/components/steps/skills-step'
import { SummaryStep } from '#/features/resume/components/steps/summary-step'
import { VolunteerStep } from '#/features/resume/components/steps/volunteer-step'
import {
  isResumeEditorStep,
  type ResumeEditorStep,
} from '#/features/resume/components/resume-editor-steps'

function assertNever(x: never): never {
  throw new Error(`Unexpected resume editor step: ${String(x)}`)
}

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
    case 'projects':
      return <ProjectsStep />
    case 'volunteer':
      return <VolunteerStep />
    case 'certifications':
      return <CertificationsStep />
    case 'awards':
      return <AwardsStep />
    case 'publications':
      return <PublicationsStep />
    case 'languages':
      return <LanguagesStep />
    case 'interests':
      return <InterestsStep />
    case 'references':
      return <ReferencesStep />
    case 'custom-sections':
      return <CustomSectionsStep />
    case 'document':
      return <DocumentStep />
    case 'preview':
      return <PreviewStep />
    default:
      return assertNever(currentStep)
  }
}
