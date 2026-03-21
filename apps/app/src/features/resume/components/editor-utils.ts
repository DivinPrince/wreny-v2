import { format, isValid, parse } from 'date-fns'

const presentPattern = /^present$/i

function decodeHtml(value: string) {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

/** Normalize legacy HTML (or mixed) resume fields to plain text for forms and markdown pipelines */
function stripStoredHtmlToPlainText(value: string) {
  return decodeHtml(
    value
      .replace(/<\/(p|div|h\d|li|ul|ol)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n'),
  ).trim()
}

export function generateEditorId() {
  return crypto.randomUUID()
}

export function sanitizeOptionalUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Load value for form: strip legacy HTML, decode entities, otherwise markdown pass-through */
export function toMarkdownForForm(value: string) {
  return stripStoredHtmlToPlainText(value ?? '')
}

/** Store value: already markdown from form, save as-is */
export function toMarkdownForStorage(value: string) {
  return value?.trim() ?? ''
}

/** Convert bullet lines (one per line) to markdown list */
export function linesToMarkdown(lines: string) {
  const items = lines
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]!
  return items.map((item) => `- ${item}`).join('\n')
}

/** Extract bullet lines from markdown for form display */
export function markdownToLines(value: string) {
  return stripStoredHtmlToPlainText(value ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-*+]\s+/, '').trim())
    .filter(Boolean)
    .join('\n')
}

/** @deprecated Use toMarkdownForForm */
export const htmlToPlainText = toMarkdownForForm

/** @deprecated Use toMarkdownForStorage */
export const paragraphTextToHtml = toMarkdownForStorage

/** @deprecated Use linesToMarkdown */
export const bulletLinesToHtml = linesToMarkdown

/** @deprecated Use markdownToLines */
export const htmlToBulletLines = markdownToLines

export function monthValueToLabel(value: string) {
  if (!value) {
    return ''
  }

  const date = new Date(`${value}-01T00:00:00`)
  return Number.isNaN(date.getTime()) ? '' : format(date, 'MMMM yyyy')
}

export function monthLabelToValue(value: string) {
  if (!value) {
    return ''
  }

  const normalized = value.trim()
  const parsed = parse(normalized, 'MMMM yyyy', new Date())
  return isValid(parsed) ? format(parsed, 'yyyy-MM') : ''
}

export function parseDateRange(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return {
      start: '',
      end: '',
      isCurrent: false,
    }
  }

  const delimiter = [' - ', ' to ', ' – ', ' — '].find((candidate) => trimmed.includes(candidate))

  if (!delimiter) {
    return {
      start: monthLabelToValue(trimmed),
      end: '',
      isCurrent: false,
    }
  }

  const [startLabel, endLabel] = trimmed.split(delimiter)
  const isCurrent = presentPattern.test(endLabel.trim())

  return {
    start: monthLabelToValue(startLabel.trim()),
    end: isCurrent ? '' : monthLabelToValue(endLabel.trim()),
    isCurrent,
  }
}

export function formatDateRange({
  start,
  end,
  isCurrent,
}: Readonly<{
  start: string
  end: string
  isCurrent: boolean
}>) {
  const startLabel = monthValueToLabel(start)
  const endLabel = isCurrent ? 'Present' : monthValueToLabel(end)

  if (!startLabel) {
    return endLabel
  }

  if (!endLabel) {
    return startLabel
  }

  return `${startLabel} - ${endLabel}`
}
