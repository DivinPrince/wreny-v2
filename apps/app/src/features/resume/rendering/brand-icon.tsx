import { forwardRef } from 'react'

import { cn } from '#/lib/utils'

type BrandIconProps = {
  slug: string
  className?: string
}

export function getIconifyPath(slug: string) {
  if (!slug) {
    return ''
  }

  if (slug.includes('/')) {
    return slug
  }

  if (slug.includes(':')) {
    const [prefix, ...nameParts] = slug.split(':')
    const name = nameParts.join(':')

    return `${prefix}/${name}`
  }

  return `simple-icons/${slug}`
}

export const BrandIcon = forwardRef<HTMLImageElement, BrandIconProps>(
  ({ slug, className }, ref) => {
    const iconifyPath = getIconifyPath(slug)

    if (!iconifyPath) {
      return null
    }

    return (
      <img
        ref={ref}
        alt={slug}
        className={cn('size-4 shrink-0', className)}
        src={`https://api.iconify.design/${iconifyPath}.svg`}
      />
    )
  },
)

BrandIcon.displayName = 'BrandIcon'
