import type { ReactNode } from 'react'
import { pageSizeMap, cn } from '../lib/template-utils'
import { useResumeStore } from './store'

export const MM_TO_PX = 3.78

type PageProps = {
  mode?: 'preview' | 'thumbnail'
  pageNumber: number
  children: ReactNode
}

export function Page({ mode = 'preview', pageNumber, children }: Readonly<PageProps>) {
  const page = useResumeStore((state) => state.resume.metadata.page)
  const typography = useResumeStore((state) => state.resume.metadata.typography)
  const fontFamily = typography.font.family

  return (
    <div
      data-page={pageNumber}
      className={cn(
        'resume-page relative bg-background text-foreground',
        mode === 'preview' && 'shadow-[0_32px_90px_rgba(15,23,42,0.12)]',
        typography.hideIcons && 'hide-icons',
        typography.underlineLinks && 'underline-links',
      )}
      style={{
        fontFamily,
        width: `${pageSizeMap[page.format].width * MM_TO_PX}px`,
        minHeight: `${pageSizeMap[page.format].height * MM_TO_PX}px`,
      }}
    >
      {children}
    </div>
  )
}
