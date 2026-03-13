import { forwardRef } from 'react'

type BrandIconProps = {
  slug: string
}

export const BrandIcon = forwardRef<HTMLImageElement, BrandIconProps>(({ slug }, ref) => {
  const normalizedSlug = slug === 'linkedin' ? 'linkedin' : slug

  return (
    <img
      ref={ref}
      alt={slug}
      className="size-4"
      src={`https://cdn.simpleicons.org/${normalizedSlug}`}
    />
  )
})

BrandIcon.displayName = 'BrandIcon'
