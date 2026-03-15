import type { ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'

import type { DocumentChange } from '@repo/core/agent'

import { InlineTextDiff } from '#/lib/inline-diff'

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
    <InlineTextDiff
      original={change.original || ''}
      proposed={change.proposed || ''}
      removedClassName="bg-red-100/90 text-red-800 line-through dark:bg-red-950/60 dark:text-red-300"
      addedClassName="bg-green-100/90 text-green-800 dark:bg-green-950/60 dark:text-green-300"
      className={className}
      {...rest}
    />
  )
}

const BLOCK_TAG_PATTERN = /<\/?(article|aside|blockquote|caption|div|dl|dt|dd|figure|figcaption|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\b/i

function getSharedPrefixLength(original: string, proposed: string) {
  const maxLength = Math.min(original.length, proposed.length)
  let index = 0

  while (index < maxLength && original[index] === proposed[index]) {
    index += 1
  }

  return index
}

function getSharedSuffixLength(
  original: string,
  proposed: string,
  sharedPrefixLength: number,
) {
  const maxLength = Math.min(
    original.length - sharedPrefixLength,
    proposed.length - sharedPrefixLength,
  )
  let index = 0

  while (
    index < maxLength &&
    original[original.length - index - 1] === proposed[proposed.length - index - 1]
  ) {
    index += 1
  }

  return index
}

function isSafeHtmlBoundary(value: string, boundaryIndex: number) {
  const prefix = value.slice(0, boundaryIndex)
  return prefix.lastIndexOf('<') <= prefix.lastIndexOf('>')
}

function buildInlineDiffHtml(original: string, proposed: string) {
  const sharedPrefixLength = getSharedPrefixLength(original, proposed)
  const sharedSuffixLength = getSharedSuffixLength(
    original,
    proposed,
    sharedPrefixLength,
  )
  const originalMiddleStart = sharedPrefixLength
  const originalMiddleEnd = original.length - sharedSuffixLength
  const proposedMiddleStart = sharedPrefixLength
  const proposedMiddleEnd = proposed.length - sharedSuffixLength
  const boundariesAreSafe =
    isSafeHtmlBoundary(original, originalMiddleStart) &&
    isSafeHtmlBoundary(original, originalMiddleEnd) &&
    isSafeHtmlBoundary(proposed, proposedMiddleStart) &&
    isSafeHtmlBoundary(proposed, proposedMiddleEnd)

  if (!boundariesAreSafe) {
    return null
  }

  const removed = original.slice(originalMiddleStart, originalMiddleEnd)
  const added = proposed.slice(proposedMiddleStart, proposedMiddleEnd)

  if (
    BLOCK_TAG_PATTERN.test(removed) ||
    BLOCK_TAG_PATTERN.test(added)
  ) {
    return null
  }

  return sanitize(
    `${original.slice(0, originalMiddleStart)}${removed ? `<span class="resume-diff-old">${removed}</span>` : ''}${added ? `<span class="resume-diff-new">${added}</span>` : ''}${original.slice(originalMiddleEnd)}`,
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

  const original = change.original || ''
  const proposed = change.proposed || ''
  const diffHtml =
    buildInlineDiffHtml(original, proposed) ??
    `<span class="resume-diff-old">${sanitize(original)}</span> <span class="resume-diff-new">${sanitize(proposed)}</span>`
  return (
    <div
      dangerouslySetInnerHTML={{ __html: diffHtml }}
      className={className}
      style={style}
    />
  )
}
