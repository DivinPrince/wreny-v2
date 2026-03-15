import type { ReactNode } from 'react'

import { InlineEditable } from '#/features/cover-letter/components/inline-editable'

type EditableDocumentTitleProps = Readonly<{
  value: string
  placeholder: string
  ariaLabel: string
  active: boolean
  onChange: (value: string) => void
  onActivate: () => void
  onDeactivate: () => void
  validationMessage?: ReactNode
}>

export function EditableDocumentTitle({
  value,
  placeholder,
  ariaLabel,
  active,
  onChange,
  onActivate,
  onDeactivate,
  validationMessage,
}: EditableDocumentTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight">
        <InlineEditable
          element="span"
          value={value}
          placeholder={placeholder}
          ariaLabel={ariaLabel}
          active={active}
          onActivate={onActivate}
          onChange={onChange}
          onDeactivate={onDeactivate}
          displayClassName="inline rounded-md px-1.5 py-0.5"
          editorClassName="h-11 max-w-xl text-base font-semibold"
        />
      </h1>
      {validationMessage}
    </div>
  )
}
