import type { KeyboardEvent } from 'react'
import { useEffect, useRef } from 'react'

import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'

type InlineEditableProps = Readonly<{
  value: string
  placeholder: string
  ariaLabel: string
  active: boolean
  multiline?: boolean
  element?: 'span' | 'div'
  displayClassName?: string
  editorClassName?: string
  onActivate: () => void
  onChange: (value: string) => void
  onDeactivate: () => void
}>

export function InlineEditable({
  value,
  placeholder,
  ariaLabel,
  active,
  multiline = false,
  element = 'div',
  displayClassName,
  editorClassName,
  onActivate,
  onChange,
  onDeactivate,
}: InlineEditableProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const Tag = element
  const hasValue = value.trim().length > 0

  useEffect(() => {
    if (!active || !inputRef.current) {
      return
    }

    inputRef.current.focus()

    if ('setSelectionRange' in inputRef.current) {
      const cursorPosition = inputRef.current.value.length
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
    }
  }, [active])

  if (active) {
    if (multiline) {
      const rows = Math.min(Math.max(value.split('\n').length, 3), 12)

      return (
        <Textarea
          ref={inputRef}
          value={value}
          rows={rows}
          aria-label={ariaLabel}
          className={cn(
            'cover-letter-editable-input min-h-0 resize-none text-inherit',
            editorClassName,
          )}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onDeactivate}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              onDeactivate()
            }
          }}
        />
      )
    }

    return (
      <Input
        ref={inputRef}
        value={value}
        aria-label={ariaLabel}
        className={cn(
          'cover-letter-editable-input h-auto text-inherit',
          editorClassName,
        )}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onDeactivate}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault()
            onDeactivate()
          }
        }}
      />
    )
  }

  return (
    <Tag
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={cn(
        'cover-letter-editable outline-none',
        multiline && 'whitespace-pre-wrap',
        !hasValue && 'cover-letter-editable-empty',
        displayClassName,
      )}
      onClick={onActivate}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate()
        }
      }}
    >
      {hasValue ? value : placeholder}
    </Tag>
  )
}
