import { createPendingChangesHelpers } from '#/features/rendering/create-pending-changes'

const diffRemovedClassName =
  'bg-red-100/90 text-red-800 line-through dark:bg-red-950/60 dark:text-red-300'
const diffAddedClassName =
  'bg-green-100/90 text-green-800 dark:bg-green-950/60 dark:text-green-300'

export const {
  PendingChangesProvider,
  usePendingChanges,
  usePendingChange,
  usePendingValue,
  DiffText,
  DiffMarkdown,
} = createPendingChangesHelpers({
  removedClassName: diffRemovedClassName,
  addedClassName: diffAddedClassName,
})
