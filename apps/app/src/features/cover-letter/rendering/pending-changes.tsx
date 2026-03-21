import { createPendingChangesHelpers } from '#/features/rendering/create-pending-changes'

const diffRemovedClassName = 'cover-letter-diff-old'
const diffAddedClassName = 'cover-letter-diff-new'

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
