import { forwardRef } from 'react'

type BrandIconProps = {
  slug: string
}

function getIconifyPath(slug: string) {
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

export const BrandIcon = forwardRef<HTMLImageElement, BrandIconProps>(({ slug }, ref) => {
  const iconifyPath = getIconifyPath(slug)

  if (!iconifyPath) {
    return null
  }

  return (
    <img
      ref={ref}
      alt={slug}
      className="size-4"
      src={`https://api.iconify.design/${iconifyPath}.svg`}
    />
  )
})

BrandIcon.displayName = 'BrandIcon'
