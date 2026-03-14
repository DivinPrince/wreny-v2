export const templateIds = [
  'azurill',
  'bronzor',
  'chikorita',
  'ditto',
  'gengar',
  'glalie',
  'kakuna',
  'leafish',
  'nosepass',
  'onyx',
  'pikachu',
  'rhyhorn',
  'static',
] as const

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
    id: 'onyx',
    name: 'Onyx',
    isRecommended: true,
    description: 'Compact executive layout with crisp hierarchy and dense information balance.',
    accent: '#0f172a',
  },
  {
    id: 'azurill',
    name: 'Azurill',
    isRecommended: true,
    description: 'Clean split-column system with clear sidebar emphasis for modern resumes.',
    accent: '#2563eb',
  },
  {
    id: 'bronzor',
    name: 'Bronzor',
    isRecommended: false,
    description: 'Quiet professional structure with calm spacing and understated dividers.',
    accent: '#4b5563',
  },
  {
    id: 'chikorita',
    name: 'Chikorita',
    isRecommended: true,
    description: 'Bold two-column layout that foregrounds personality and skills.',
    accent: '#15803d',
  },
  {
    id: 'ditto',
    name: 'Ditto',
    isRecommended: true,
    description: 'Graphic editorial composition with a strong hero header treatment.',
    accent: '#7c3aed',
  },
  {
    id: 'gengar',
    name: 'Gengar',
    isRecommended: false,
    description: 'High-contrast design with expressive sidebars and premium emphasis.',
    accent: '#7c2d92',
  },
  {
    id: 'glalie',
    name: 'Glalie',
    isRecommended: false,
    description: 'Asymmetric showcase template with strong contrast and timeline rhythm.',
    accent: '#0f766e',
  },
  {
    id: 'kakuna',
    name: 'Kakuna',
    isRecommended: true,
    description: 'Traditional resume framing with centered section dividers and measured spacing.',
    accent: '#a16207',
  },
  {
    id: 'leafish',
    name: 'Leafish',
    isRecommended: false,
    description: 'Soft contemporary grid with image-forward top band and color wash.',
    accent: '#0f766e',
  },
  {
    id: 'nosepass',
    name: 'Nosepass',
    isRecommended: false,
    description: 'Minimal typography-led curriculum vitae with calm academic energy.',
    accent: '#b45309',
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    isRecommended: true,
    description: 'Energetic three-column presentation built for standout personal branding.',
    accent: '#ca8a04',
  },
  {
    id: 'rhyhorn',
    name: 'Rhyhorn',
    isRecommended: false,
    description: 'Classic recruiter-friendly layout with sturdy section grouping.',
    accent: '#6b7280',
  },
  {
    id: 'static',
    name: 'Static',
    isRecommended: false,
    description: 'Compact preview layout with sidebar skills and main content.',
    accent: '#4b5563',
  },
] as const
