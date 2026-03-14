import type { CoverLetterDocument } from '@repo/core/schemas'

export type CoverLetterEditorBindings = {
  activeField: string | null
  onActivateField: (fieldId: string) => void
  onDeactivateField: () => void
  onChangeField: (fieldId: string, value: string) => void
  onAddBodyParagraph: () => void
  onRemoveBodyParagraph: (index: number) => void
}

export type TemplateMode = 'preview' | 'thumbnail' | 'editor'

export type TemplateProps = {
  coverLetter: CoverLetterDocument
  mode?: TemplateMode
  editor?: CoverLetterEditorBindings
}
