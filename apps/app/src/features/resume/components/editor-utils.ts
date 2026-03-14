import { format, isValid, parse } from 'date-fns'

const presentPattern = /^present$/i

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function decodeHtml(value: string) {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
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

export function htmlToPlainText(value: string) {
  return decodeHtml(
    value
      .replace(/<\/(p|div|h\d|li|ul|ol)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n'),
  ).trim()
}

export function paragraphTextToHtml(value: string) {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) {
    return ''
  }

  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

export function bulletLinesToHtml(value: string) {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return ''
  }

  if (lines.length === 1) {
    return `<p>${escapeHtml(lines[0])}</p>`
  }

  return `<ul>${lines.map((line) => `<li><p>${escapeHtml(line)}</p></li>`).join('')}</ul>`
}

export function htmlToBulletLines(value: string) {
  return htmlToPlainText(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

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
