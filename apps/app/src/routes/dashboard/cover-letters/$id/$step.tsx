import { createFileRoute, redirect } from '@tanstack/react-router'

import { PreviewStep } from '#/features/cover-letter/components/steps/preview-step'
import {
  isCoverLetterEditorStep,
} from '#/features/cover-letter/components/cover-letter-editor-shell'

export const Route = createFileRoute('/dashboard/cover-letters/$id/$step')({
  beforeLoad: ({ params }) => {
    if (!isCoverLetterEditorStep(params.step) || params.step !== 'preview') {
      throw redirect({
        to: '/dashboard/cover-letters/$id/$step',
        params: {
          id: params.id,
          step: 'preview',
        },
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <PreviewStep />
}
