import type { CSSProperties, ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'

import type { DocumentChange } from '@repo/core/agent'

import { MarkdownContent } from '#/components/ui/markdown-content'
import { InlineTextDiff, splitInlineTextDiff } from '#/lib/inline-diff'

export type ChangeField = string | string[]

type PendingChangesContextValue = {
  changes: DocumentChange[]
}

type CreatePendingChangesOptions = Readonly<{
  removedClassName: string
  addedClassName: string
  passRestWhenNoChange?: boolean
}>

function matchChange(
  changes: DocumentChange[],
  section: string,
  field: ChangeField,
  itemId?: string,
): DocumentChange | undefined {
  const fields = Array.isArray(field) ? field : [field]

  return changes.find(
    (change) =>
      change.operation === 'replace' &&
      change.section === section &&
      fields.includes(change.field) &&
      (itemId ? change.itemId === itemId : !change.itemId),
  )
}

export function createPendingChangesHelpers({
  removedClassName,
  addedClassName,
  passRestWhenNoChange = false,
}: CreatePendingChangesOptions) {
  const PendingChangesContext =
    createContext<PendingChangesContextValue | null>(null)

  function PendingChangesProvider({
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

  function usePendingChanges() {
    const ctx = useContext(PendingChangesContext)
    return ctx?.changes ?? []
  }

  function usePendingChange(
    section: string,
    field: ChangeField,
    itemId?: string,
  ) {
    const changes = usePendingChanges()
    return matchChange(changes, section, field, itemId)
  }

  function usePendingValue({
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

  function DiffText({
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
      return passRestWhenNoChange ? (
        <span className={className} {...rest}>
          {children}
        </span>
      ) : (
        <span className={className}>{children}</span>
      )
    }

    return (
      <InlineTextDiff
        original={change.original || ''}
        proposed={change.proposed || ''}
        removedClassName={removedClassName}
        addedClassName={addedClassName}
        className={className}
        {...rest}
      />
    )
  }

  function DiffMarkdown({
    section,
    field,
    itemId,
    content,
    className,
    style,
  }: Readonly<{
    section: string
    field: ChangeField
    itemId?: string
    content: string
    className?: string
    style?: CSSProperties
  }>) {
    const change = usePendingChange(section, field, itemId)
    const markdown = content?.trim() ?? ''

    if (!change) {
      return (
        <MarkdownContent className={className} style={style}>
          {markdown}
        </MarkdownContent>
      )
    }

    const originalMd = (change.original || '').trim()
    const proposedMd = (change.proposed || '').trim()
    const diff = splitInlineTextDiff(originalMd, proposedMd)

    return (
      <div className={className} style={style}>
        {diff.prefix ? (
          <MarkdownContent inline>{diff.prefix}</MarkdownContent>
        ) : null}
        {diff.removed ? (
          <span className={removedClassName}>
            <MarkdownContent inline>{diff.removed}</MarkdownContent>
          </span>
        ) : null}
        {diff.added ? (
          <span className={addedClassName}>
            <MarkdownContent inline>{diff.added}</MarkdownContent>
          </span>
        ) : null}
        {diff.suffix ? (
          <MarkdownContent inline>{diff.suffix}</MarkdownContent>
        ) : null}
      </div>
    )
  }

  return {
    PendingChangesProvider,
    usePendingChanges,
    usePendingChange,
    usePendingValue,
    DiffText,
    DiffMarkdown,
  }
}
