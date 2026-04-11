import { BrandIcon } from './brand-icon'

type CustomFieldIconProps = {
  slug: string
  className?: string
}

/** Legacy Phosphor webfont names from before custom fields used the same Iconify slugs as profiles. */
const LEGACY_PHOSPHOR_TO_ICONIFY: Record<string, string> = {
  link: 'mdi:link-variant',
  'map-pin': 'mdi:map-marker',
  globe: 'mdi:earth',
  phone: 'mdi:phone',
  at: 'mdi:at',
}

export function resolveCustomFieldIconSlug(slug: string): string {
  const t = slug.trim()
  if (!t) return ''
  if (t.includes(':') || t.includes('/')) return t
  return LEGACY_PHOSPHOR_TO_ICONIFY[t] ?? t
}

export function CustomFieldIcon({ slug, className }: Readonly<CustomFieldIconProps>) {
  const resolved = resolveCustomFieldIconSlug(slug)
  if (!resolved) return null
  return <BrandIcon slug={resolved} className={className} />
}
