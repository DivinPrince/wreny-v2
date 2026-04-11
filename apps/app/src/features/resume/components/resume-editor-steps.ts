export const resumeContentStepDefinitions = [
  { id: 'contact', label: 'Contact' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'summary', label: 'Summary' },
  { id: 'projects', label: 'Projects' },
  { id: 'volunteer', label: 'Volunteering' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'awards', label: 'Awards' },
  { id: 'publications', label: 'Publications' },
  { id: 'languages', label: 'Languages' },
  { id: 'interests', label: 'Interests' },
  { id: 'references', label: 'References' },
  { id: 'custom-sections', label: 'Custom sections' },
  { id: 'document', label: 'Document' },
] as const

export const primaryResumeStepIds = [
  'contact',
  'experience',
  'education',
  'skills',
  'summary',
] as const

export type PrimaryResumeStepId = (typeof primaryResumeStepIds)[number]

export type ResumeContentStepId = (typeof resumeContentStepDefinitions)[number]['id']

export const resumeEditorStepDefinitions = [
  ...resumeContentStepDefinitions,
  { id: 'preview', label: 'Preview' },
] as const

export type ResumeEditorStep = (typeof resumeEditorStepDefinitions)[number]['id']

export function isResumeEditorStep(value: string): value is ResumeEditorStep {
  return resumeEditorStepDefinitions.some((step) => step.id === value)
}

export function isPrimaryResumeStep(value: string): value is PrimaryResumeStepId {
  return (primaryResumeStepIds as readonly string[]).includes(value)
}

export function getResumeContentStepLabel(id: ResumeContentStepId): string {
  const step = resumeContentStepDefinitions.find((s) => s.id === id)
  return step?.label ?? id
}
