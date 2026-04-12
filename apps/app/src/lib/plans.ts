export type Plan = {
  productId?: string
  name: string
  price: number
  priceAnchor?: number
  slug: string
  description: string
  recurring?: boolean
  cancelAnytime?: boolean
  isFeatured?: boolean
  features: string[]
}

export const plans: Plan[] = [
  {
    productId: 'free-plan',
    name: 'Free',
    price: 0,
    priceAnchor: 0,
    slug: 'free',
    description: 'Get started with basic features',
    features: [
      '1 resume with limited formatting',
      '1 cover letter',
      'Track up to 10 job applications',
      '5 AI bullet point generations',
      'Basic ATS optimization',
      'PDF exports only',
    ],
  },
  {
    productId: import.meta.env.DEV
      ? '3bc32b7c-0cc8-4c0d-a656-a130be5ba955'
      : '6eb40ae7-0242-4c23-a745-fc464d5c2ac8',
    name: 'Pro',
    price: 19,
    recurring: true,
    slug: 'pro',
    description: 'Monthly subscription with all features',
    cancelAnytime: true,
    features: [
      'Unlimited resumes and cover letters',
      'Unlimited job tracking',
      'Full AI tools access',
      'All templates and formats',
      'Advanced job analytics',
      'Multiple export formats',
      'Cancel anytime',
    ],
  },
  {
    productId: import.meta.env.DEV
      ? '47a51775-6db1-4b24-97e7-d05d00e64f52'
      : 'bfdb62d6-3bc4-4cb4-abfe-095c8d36fdd5',
    isFeatured: true,
    name: 'Lifetime',
    price: 149,
    priceAnchor: 249,
    recurring: false,
    slug: 'lifetime',
    description: 'One-time payment for lifetime access',
    features: [
      'All Pro features forever',
      'Unlimited resumes and cover letters',
      'Unlimited job tracking',
      'Full AI tools access',
      'All templates and formats',
      'Advanced job analytics',
      'Multiple export formats',
    ],
  },
]
