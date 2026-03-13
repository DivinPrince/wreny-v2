import { cn, isUrl } from '../lib/template-utils'
import { useResumeStore } from './store'

type PictureProps = {
  className?: string
}

export function Picture({ className }: Readonly<PictureProps>) {
  const picture = useResumeStore((state) => state.resume.basics.picture)
  const fontSize = useResumeStore((state) => state.resume.metadata.typography.font.size)

  if (!isUrl(picture.url) || picture.effects.hidden) return null

  return (
    <img
      src={picture.url}
      alt="Profile"
      className={cn(
        'relative z-20 object-cover',
        picture.effects.border && 'border-primary',
        picture.effects.grayscale && 'grayscale',
        className,
      )}
      style={{
        maxWidth: `${picture.size}px`,
        aspectRatio: `${picture.aspectRatio}`,
        borderRadius: `${picture.borderRadius}px`,
        borderWidth: `${picture.effects.border ? fontSize / 3 : 0}px`,
      }}
    />
  )
}
