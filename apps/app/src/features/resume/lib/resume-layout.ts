import { defaultLayout } from '@repo/core/schemas'
import type { ResumeDocument } from '@repo/core/schemas'

/** Section ids that can appear in `metadata.layout` (excluding `custom.*`, added dynamically). */
export const STANDARD_LAYOUT_SECTION_IDS = [
  'summary',
  'profiles',
  'experience',
  'education',
  'projects',
  'volunteer',
  'references',
  'skills',
  'interests',
  'certifications',
  'awards',
  'publications',
  'languages',
] as const

export type StandardLayoutSectionId = (typeof STANDARD_LAYOUT_SECTION_IDS)[number]

export function formatSectionName(section: string) {
  const raw = section.startsWith('custom.') ? section.slice('custom.'.length) : section
  return raw
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function ensureResumeSectionInLayout(resume: ResumeDocument, section: string) {
  if (section === 'basics') {
    return
  }

  const exists = resume.metadata.layout.some((page) =>
    page.some((column) => column.includes(section)),
  )
  if (exists) {
    return
  }

  if (resume.metadata.layout.length === 0) {
    resume.metadata.layout = structuredClone(defaultLayout)
  }

  const firstPage = resume.metadata.layout[0] ?? []
  if (resume.metadata.layout[0] == null) {
    resume.metadata.layout[0] = firstPage
  }

  let preferredColumnIndex = defaultLayout[0]?.findIndex((column) => column.includes(section)) ?? -1
  if (preferredColumnIndex < 0) {
    preferredColumnIndex = firstPage.length > 1 ? 1 : 0
  }

  while (firstPage.length <= preferredColumnIndex) {
    firstPage.push([])
  }

  const targetColumn = firstPage[preferredColumnIndex]
  if (targetColumn) {
    targetColumn.push(section)
  }
}

export function ensureCustomResumeSection(resume: ResumeDocument, section: string) {
  if (!section.startsWith('custom.')) {
    return
  }

  const customId = section.slice('custom.'.length)
  if (!customId || resume.sections.custom[customId]) {
    return
  }

  resume.sections.custom[customId] = {
    name: formatSectionName(section),
    columns: 1,
    separateLinks: true,
    visible: true,
    id: customId,
    items: [],
  }
}

export function collectLayoutSectionOptions(resume: ResumeDocument): { id: string; label: string }[] {
  const standard = STANDARD_LAYOUT_SECTION_IDS.map((id) => ({
    id,
    label: formatSectionName(id),
  }))
  const custom = Object.keys(resume.sections.custom).map((key) => {
    const full = `custom.${key}`
    return {
      id: full,
      label: resume.sections.custom[key]?.name?.trim() || formatSectionName(full),
    }
  })
  return [...standard, ...custom]
}
