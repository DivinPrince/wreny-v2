import '../styles.css'

import type { CoverLetterDocument } from '@repo/core/schemas'

import { getTemplateComponent } from '../templates'
import type { CoverLetterEditorBindings, TemplateMode } from '../templates/types'

export const COVER_LETTER_PAGE_WIDTH_PX = 816
export const COVER_LETTER_PAGE_HEIGHT_PX = 1056

export function CoverLetterRenderer({
  coverLetter,
  mode = 'preview',
  editor,
}: Readonly<{
  coverLetter: CoverLetterDocument
  mode?: TemplateMode
  editor?: CoverLetterEditorBindings
}>) {
  const Template = getTemplateComponent(coverLetter.metadata.template)

  return (
    <div className="cover-letter-surface">
      <Template coverLetter={coverLetter} mode={mode} editor={editor} />
    </div>
  )
}
