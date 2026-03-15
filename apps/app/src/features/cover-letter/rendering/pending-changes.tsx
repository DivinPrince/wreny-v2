import type { ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'

import type { DocumentChange } from '@repo/core/agent'

import { InlineTextDiff } from '#/lib/inline-diff'

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
      c.operation === 'replace' &&
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
    return (
      <span className={className} {...rest}>
        {children}
      </span>
    )
  }

  return (
    <InlineTextDiff
      original={change.original || ''}
      proposed={change.proposed || ''}
      removedClassName="cover-letter-diff-old"
      addedClassName="cover-letter-diff-new"
      className={className}
      {...rest}
    />
  )
}
