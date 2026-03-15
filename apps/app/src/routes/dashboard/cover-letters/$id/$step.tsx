import { createFileRoute, redirect } from '@tanstack/react-router'
import { createStandardSchemaV1, parseAsString } from 'nuqs'

import { PreviewStep } from '#/features/cover-letter/components/steps/preview-step'
import {
  isCoverLetterEditorStep,
} from '#/features/cover-letter/components/cover-letter-editor-shell'

export const Route = createFileRoute('/dashboard/cover-letters/$id/$step')({
  validateSearch: createStandardSchemaV1({
    sessionId: parseAsString,
  }, {
    partialOutput: true,
  }),
  beforeLoad: ({ params, search }) => {
    if (!isCoverLetterEditorStep(params.step) || params.step !== 'preview') {
      throw redirect({
        to: '/dashboard/cover-letters/$id/$step',
        params: {
          id: params.id,
          step: 'preview',
        },
        search,
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <PreviewStep />
}
