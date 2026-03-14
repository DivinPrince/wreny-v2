import '@phosphor-icons/web/regular/style.css'
import '../styles.css'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import type { ResumeDocument } from '@repo/core/schemas'

import { getTemplateComponent } from '../templates'
import { ResumeStoreProvider, useResumeStore } from './store'
import { Page } from './page'

function ensureFontLink(family: string, variants: string[], subset: string) {
  if (typeof document === 'undefined') return

  const normalizedFamily = family.replace(/\s+/g, '+')
  const normalizedVariants = variants.length > 0 ? `:${variants.join(',')}` : ''
  const href = `https://fonts.googleapis.com/css?family=${normalizedFamily}${normalizedVariants}&display=swap&subset=${subset}`
  const existing = document.head.querySelector<HTMLLinkElement>(`link[data-resume-font="${href}"]`)

  if (existing) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.resumeFont = href
  document.head.appendChild(link)
}

function ResumeRenderSurface({ children }: Readonly<{ children: ReactNode }>) {
  const metadata = useResumeStore((state) => state.resume.metadata)

  useEffect(() => {
    ensureFontLink(
      metadata.typography.font.family,
      metadata.typography.font.variants,
      metadata.typography.font.subset,
    )
  }, [metadata.typography.font.family, metadata.typography.font.subset, metadata.typography.font.variants])

  const textColor = metadata.theme.text
  const highlightColor =
    metadata.theme.highlight ?? metadata.theme.primary

  const style = useMemo(
    () =>
      ({
        '--resume-margin': `${metadata.page.margin}px`,
        '--resume-font-size': `${metadata.typography.font.size}px`,
        '--resume-line-height': `${metadata.typography.lineHeight}`,
        '--resume-color-foreground': textColor,
        '--resume-color-primary': textColor,
        '--resume-color-highlight': highlightColor,
        '--resume-color-background': metadata.theme.background,
        // In the resume editor, "text color" is the main ink color used across the
        // document. Keep primary aligned with it so older templates still render correctly.
        '--color-foreground': textColor,
        '--color-primary': textColor,
        '--color-highlight': highlightColor,
        '--color-background': metadata.theme.background,
      }) as CSSProperties,
    [metadata, highlightColor, textColor],
  )

  return (
    <div className="resume-surface" style={style}>
      {metadata.css.visible ? <style>{metadata.css.value}</style> : null}
      {children}
    </div>
  )
}

function ResumePages({ mode = 'preview' }: Readonly<{ mode?: 'preview' | 'thumbnail' }>) {
  const resume = useResumeStore((state) => state.resume)
  const templateId = resume.metadata.template
  const Template = getTemplateComponent(templateId)

  return (
    <ResumeRenderSurface>
      {resume.metadata.layout.map((columns, pageIndex) => (
        <Page key={pageIndex} mode={mode} pageNumber={pageIndex + 1}>
          <Template isFirstPage={pageIndex === 0} columns={columns} />
        </Page>
      ))}
    </ResumeRenderSurface>
  )
}

export function ResumeRenderer({
  resume,
  mode = 'preview',
}: Readonly<{
  resume: ResumeDocument
  mode?: 'preview' | 'thumbnail'
}>) {
  return (
    <ResumeStoreProvider resume={resume}>
      <ResumePages mode={mode} />
    </ResumeStoreProvider>
  )
}
