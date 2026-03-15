import { useMemo } from 'react'

import type { DocumentChange } from '@repo/core/agent'

import { cn } from '../lib/template-utils'
import { usePendingChanges } from './pending-changes'

/** Hook to get section-level diff state: hidden status and deleted items */
export function useSectionDiff(section: string) {
  const changes = usePendingChanges()

  return useMemo(() => {
    const hiddenChange = changes.find(
      (change) =>
        change.operation === 'set-section-visible' &&
        change.section === section &&
        change.field === 'visible',
    )
    const deletedItems = changes.filter(
      (change) =>
        change.operation === 'delete-item' &&
        change.section === section,
    )

    return {
      isHidden: hiddenChange?.proposed === 'false',
      deletedItems,
    }
  }, [changes, section])
}

/** Displays original (strikethrough) vs proposed text for section visibility or item removal */
export function DiffView({
  original,
  proposed = 'Removed',
  className,
}: Readonly<{
  original: string
  proposed?: string
  className?: string
}>) {
  return (
    <div
      className={cn(
        'rounded-md border border-dashed border-red-300/80 bg-red-50/70 px-2.5 py-1.5 dark:border-red-900 dark:bg-red-950/20',
        className,
      )}
    >
      <span
        className="bg-red-100/90 text-red-800 line-through dark:bg-red-950/60 dark:text-red-300"
        style={{ textDecorationColor: 'currentColor' }}
      >
        {original}
      </span>
      <span className="ml-1 rounded-sm bg-green-100/90 px-1 text-green-800 dark:bg-green-950/60 dark:text-green-300">
        {proposed}
      </span>
    </div>
  )
}

/** Wrapper for DiffView for deleted item changes */
export function DeletedItemDiff({
  change,
  className,
}: Readonly<{
  change: DocumentChange
  className?: string
}>) {
  return (
    <DiffView
      original={change.original || 'Item'}
      proposed="Removed"
      className={className}
    />
  )
}
