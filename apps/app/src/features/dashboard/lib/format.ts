export function formatRelativeDate(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (Number.isNaN(date.getTime())) {
    return "Recently updated"
  }

  if (diffDays <= 0) {
    return "Updated today"
  }

  if (diffDays === 1) {
    return "Updated yesterday"
  }

  if (diffDays < 7) {
    return `Updated ${diffDays} days ago`
  }

  return `Updated ${date.toLocaleDateString()}`
}
