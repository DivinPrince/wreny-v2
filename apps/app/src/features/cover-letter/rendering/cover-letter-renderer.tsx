import '../styles.css'

import type { DocumentChange } from '@repo/core/agent'
import type { CoverLetterDocument } from '@repo/core/schemas'

import { getTemplateComponent } from '../templates'
import type { CoverLetterEditorBindings, TemplateMode } from '../templates/types'
import { PendingChangesProvider } from './pending-changes'

export const COVER_LETTER_PAGE_WIDTH_PX = 816
export const COVER_LETTER_PAGE_HEIGHT_PX = 1056
const EMPTY_PENDING_CHANGES: DocumentChange[] = []

export function CoverLetterRenderer({
  coverLetter,
  mode = 'preview',
  editor,
  pendingChanges = EMPTY_PENDING_CHANGES,
}: Readonly<{
  coverLetter: CoverLetterDocument
  mode?: TemplateMode
  editor?: CoverLetterEditorBindings
  pendingChanges?: DocumentChange[]
}>) {
  const Template = getTemplateComponent(coverLetter.metadata.template)

  return (
    <PendingChangesProvider changes={pendingChanges}>
      <div className="cover-letter-surface">
        <Template coverLetter={coverLetter} mode={mode} editor={editor} />
      </div>
    </PendingChangesProvider>
  )
}
