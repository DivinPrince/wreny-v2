export const templateIds = ['classic', 'modern', 'executive'] as const

export type TemplateId = (typeof templateIds)[number]

export type TemplateSummary = {
  id: TemplateId
  name: string
  isRecommended: boolean
  description: string
  accent: string
}

export const templates: readonly TemplateSummary[] = [
  {
    id: 'classic',
    name: 'Classic',
    isRecommended: true,
    description: 'Traditional cover letter with formal spacing and recruiter-friendly structure.',
    accent: '#1f2937',
  },
  {
    id: 'modern',
    name: 'Modern',
    isRecommended: true,
    description: 'Clean contemporary layout with subtle color contrast and crisp hierarchy.',
    accent: '#1d4ed8',
  },
  {
    id: 'executive',
    name: 'Executive',
    isRecommended: false,
    description: 'Premium business presentation with refined typography and stronger framing.',
    accent: '#7c2d12',
  },
] as const
