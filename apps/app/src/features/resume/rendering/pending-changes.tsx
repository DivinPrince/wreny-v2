import type { ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'

import type { DocumentChange } from '@repo/core/agent'

import { sanitize } from '../lib/template-utils'

type PendingChangesContextValue = {
  changes: DocumentChange[]
}

type ChangeField = string | string[]

const PendingChangesContext = createContext<PendingChangesContextValue | null>(
  null,
)

function matchChange(
  changes: DocumentChange[],
  section: string,
  field: ChangeField,
  itemId?: string,
): DocumentChange | undefined {
  const fields = Array.isArray(field) ? field : [field]

  return changes.find(
    (c) =>
      c.section === section &&
      fields.includes(c.field) &&
      (itemId ? c.itemId === itemId : !c.itemId),
  )
}

export function PendingChangesProvider({
  changes,
  children,
}: Readonly<{
  changes: DocumentChange[]
  children: ReactNode
}>) {
  const value = useMemo(() => ({ changes }), [changes])
  return (
    <PendingChangesContext.Provider value={value}>
      {children}
    </PendingChangesContext.Provider>
  )
}

export function usePendingChanges() {
  const ctx = useContext(PendingChangesContext)
  return ctx?.changes ?? []
}

export function usePendingChange(
  section: string,
  field: ChangeField,
  itemId?: string,
) {
  const changes = usePendingChanges()
  return matchChange(changes, section, field, itemId)
}

export function usePendingValue({
  section,
  field,
  itemId,
  fallback,
}: Readonly<{
  section: string
  field: ChangeField
  itemId?: string
  fallback: string
}>) {
  const change = usePendingChange(section, field, itemId)
  return change?.proposed ?? fallback
}

/** Renders plain text with inline diff: red strikethrough for original, green for proposed */
export function DiffText({
  section,
  field,
  itemId,
  children,
  className,
  ...rest
}: Readonly<{
  section: string
  field: ChangeField
  itemId?: string
  children: string
  className?: string
  [key: string]: unknown
}>) {
  const change = usePendingChange(section, field, itemId)

  if (!change) {
    return <span className={className}>{children}</span>
  }

  return (
    <span className={className} {...rest}>
      <span
        className="bg-red-100/90 text-red-800 line-through dark:bg-red-950/60 dark:text-red-300"
        style={{ textDecorationColor: 'currentColor' }}
      >
        {change.original || '\u00A0'}
      </span>
      <span className="ml-0.5 bg-green-100/90 text-green-800 dark:bg-green-950/60 dark:text-green-300">
        {change.proposed || '\u00A0'}
      </span>
    </span>
  )
}

/** Renders HTML content with inline diff for summary/wysiwyg fields */
export function DiffHTML({
  section,
  field,
  itemId,
  html,
  className,
  style,
}: Readonly<{
  section: string
  field: ChangeField
  itemId?: string
  html: string
  className?: string
  style?: React.CSSProperties
}>) {
  const change = usePendingChange(section, field, itemId)

  if (!change) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: sanitize(html) }}
        className={className}
        style={style}
      />
    )
  }

  const oldHtml = sanitize(change.original || '')
  const newHtml = sanitize(change.proposed || '')
  const diffHtml = `<span class="resume-diff-old">${oldHtml}</span> <span class="resume-diff-new">${newHtml}</span>`
  return (
    <div
      dangerouslySetInnerHTML={{ __html: diffHtml }}
      className={className}
      style={style}
    />
  )
}
