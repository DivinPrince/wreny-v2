import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { DocumentChange } from '@repo/core/agent'
import type { ResumeDocument } from '@repo/core/schemas'
import {
  ChevronDown,
  Download,
  Ellipsis,
  FileText,
  Highlighter,
  Minus,
  Plus,
  Printer,
  Type,
  Underline,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Icons } from '#/components/ui/icons'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/components/ui/tooltip'
import { api } from '#/lib/api'
import { cn } from '#/lib/utils'

import { AgentPanelContent } from '../agent-popover'
import { cloneResumeDocument, resumeKeys } from '../../lib/queries'
import { templates } from '../../lib/template-registry'
import { pageSizeMap } from '../../lib/template-utils'
import { MM_TO_PX } from '../../rendering/Page'
import { ResumeRenderer } from '../../rendering/resume-renderer'
import { useResumeEditor } from '../resume-editor-context'

const fontOptions = [
  'Open Sans',
  'IBM Plex Serif',
  'Merriweather',
  'Lora',
  'Source Sans 3',
  'Playfair Display',
] as const

const lineHeightOptions = [1.3, 1.4, 1.5, 1.6, 1.75] as const

const pageFormats = ['a4', 'letter'] as const

const pageMarginOptions = [12, 14, 16, 18, 20, 24] as const

const presetTextColors = [
  '#0f172a',
  '#2563eb',
  '#15803d',
  '#7c3aed',
  '#7c2d92',
  '#0f766e',
  '#a16207',
  '#b45309',
  '#ca8a04',
  '#dc2626',
  '#4b5563',
  '#6b7280',
]

const presetHighlightColors = [
  '#1d4ed8',
  '#2563eb',
  '#0369a1',
  '#0f766e',
  '#15803d',
  '#65a30d',
  '#a16207',
  '#c2410c',
  '#dc2626',
  '#be185d',
  '#7c3aed',
  '#4b5563',
]

function updateDraft(
  current: ResumeDocument,
  updater: (draft: ResumeDocument) => void,
) {
  const next = cloneResumeDocument(current)
  updater(next)
  return next
}

function setDocumentField(
  target: Record<string, unknown>,
  field: string,
  value: unknown,
) {
  if (field in target) {
    target[field] = value
  }
}

function getSectionGroup(resume: ResumeDocument, section: string) {
  if (section.startsWith('custom.')) {
    return resume.sections.custom[section.slice('custom.'.length)]
  }

  if (section === 'custom') {
    return undefined
  }

  return section in resume.sections
    ? resume.sections[section as keyof typeof resume.sections]
    : undefined
}

function applyApprovedChanges(
  current: ResumeDocument,
  changes: DocumentChange[],
) {
  return updateDraft(current, (next) => {
    for (const change of changes) {
      const { section, itemId, field, proposed } = change

      if (section === 'basics') {
        setDocumentField(next.basics as Record<string, unknown>, field, proposed)
        continue
      }

      if (section === 'summary') {
        next.sections.summary.content = proposed
        continue
      }

      const sectionGroup = getSectionGroup(next, section)
      if (!sectionGroup || !('items' in sectionGroup) || !itemId) {
        continue
      }

      const item = sectionGroup.items.find((entry) => entry.id === itemId)
      if (!item) {
        continue
      }

      if (field === 'keywords') {
        setDocumentField(
          item as Record<string, unknown>,
          field,
          proposed
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean),
        )
        continue
      }

      setDocumentField(item as Record<string, unknown>, field, proposed)
    }
  })
}

function ColorPickerPopover({
  value,
  onChange,
  label,
  presets,
  icon: Icon,
}: {
  value: string
  onChange: (color: string) => void
  label: string
  presets: readonly string[]
  icon: React.ComponentType<{ className?: string }>
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="default"
              className="h-8 gap-1.5 px-2.5"
            >
              <Icon className="size-4 shrink-0" />
              <span
                className="size-4 shrink-0 rounded border border-border"
                style={{ backgroundColor: value }}
              />
              <ChevronDown className="size-3.5 shrink-0 opacity-60" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="start" side="top" sideOffset={8} className="w-56 border-foreground/10 bg-background/95 p-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80 **:data-[variant=outline]:border-foreground/15">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-lg border border-input bg-transparent"
          />
          <div className="grid grid-cols-6 gap-1.5">
            {presets.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'size-7 rounded-md border-2 transition-colors hover:ring-2 hover:ring-ring',
                  value.toLowerCase() === color.toLowerCase()
                    ? 'border-foreground ring-2 ring-ring'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type DraftProps = {
  draft: ResumeDocument
  setDraft: React.Dispatch<React.SetStateAction<ResumeDocument>>
}

function FontFamilyDropdown({ draft, setDraft }: DraftProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="h-8 shrink-0 gap-1.5 px-2 sm:px-2.5">
          <Type className="size-4" />
          <span className="max-w-24 truncate">
            {draft.metadata.typography.font.family}
          </span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-[180px]">
        <DropdownMenuRadioGroup
          value={draft.metadata.typography.font.family}
          onValueChange={(family) =>
            setDraft((current) =>
              updateDraft(current, (next) => {
                next.metadata.typography.font.family = family
                next.metadata.typography.font.variants = ['regular', 'italic', '600']
              }),
            )
          }
        >
          {fontOptions.map((font) => (
            <DropdownMenuRadioItem key={font} value={font}>
              {font}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FontSizeControls({ draft, setDraft }: DraftProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-foreground/15 bg-background">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="h-8 w-8 rounded-r-none"
            onClick={() =>
              setDraft((current) =>
                updateDraft(current, (next) => {
                  next.metadata.typography.font.size = Math.max(10, next.metadata.typography.font.size - 1)
                }),
              )
            }
          >
            <Minus className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top"><p>Decrease font size</p></TooltipContent>
      </Tooltip>
      <span className="min-w-8 px-2 text-center text-sm tabular-nums">
        {draft.metadata.typography.font.size}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="h-8 w-8 rounded-l-none"
            onClick={() =>
              setDraft((current) =>
                updateDraft(current, (next) => {
                  next.metadata.typography.font.size = Math.min(18, next.metadata.typography.font.size + 1)
                }),
              )
            }
          >
            <Plus className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top"><p>Increase font size</p></TooltipContent>
      </Tooltip>
    </div>
  )
}

function LineHeightDropdown({ draft, setDraft }: DraftProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="h-8 gap-1.5">
          <span className="text-xs font-medium">LH</span>
          {draft.metadata.typography.lineHeight}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-[120px]">
        <DropdownMenuRadioGroup
          value={String(draft.metadata.typography.lineHeight)}
          onValueChange={(val) =>
            setDraft((current) =>
              updateDraft(current, (next) => {
                next.metadata.typography.lineHeight = Number(val)
              }),
            )
          }
        >
          {lineHeightOptions.map((value) => (
            <DropdownMenuRadioItem key={value} value={String(value)}>
              {value}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UnderlineLinksToggle({ draft, setDraft }: DraftProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={draft.metadata.typography.underlineLinks ? 'default' : 'outline'}
          size="default"
          className="h-8"
          onClick={() =>
            setDraft((current) =>
              updateDraft(current, (next) => {
                next.metadata.typography.underlineLinks = !next.metadata.typography.underlineLinks
              }),
            )
          }
        >
          <Underline className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top"><p>Underline links</p></TooltipContent>
    </Tooltip>
  )
}

function HideIconsToggle({ draft, setDraft }: DraftProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={draft.metadata.typography.hideIcons ? 'default' : 'outline'}
          size="default"
          className="h-8"
          onClick={() =>
            setDraft((current) =>
              updateDraft(current, (next) => {
                next.metadata.typography.hideIcons = !next.metadata.typography.hideIcons
              }),
            )
          }
        >
          <FileText className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{draft.metadata.typography.hideIcons ? 'Show icons' : 'Hide icons'}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function PageFormatDropdown({ draft, setDraft }: DraftProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="h-8 gap-1.5">
          <Printer className="size-4" />
          {draft.metadata.page.format.toUpperCase()}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-[120px]">
        <DropdownMenuRadioGroup
          value={draft.metadata.page.format}
          onValueChange={(format) =>
            setDraft((current) =>
              updateDraft(current, (next) => {
                next.metadata.page.format = format as 'a4' | 'letter'
              }),
            )
          }
        >
          {pageFormats.map((f) => (
            <DropdownMenuRadioItem key={f} value={f}>
              {f.toUpperCase()}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PageMarginDropdown({ draft, setDraft }: DraftProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="h-8 gap-1.5">
          {draft.metadata.page.margin}px
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-[100px]">
        <DropdownMenuRadioGroup
          value={String(draft.metadata.page.margin)}
          onValueChange={(val) =>
            setDraft((current) =>
              updateDraft(current, (next) => {
                next.metadata.page.margin = Number(val)
              }),
            )
          }
        >
          {pageMarginOptions.map((m) => (
            <DropdownMenuRadioItem key={m} value={String(m)}>
              {m}px
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TemplatesDropdown({ draft, setDraft }: DraftProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="h-8">
          Templates
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="min-w-64">
        <DropdownMenuRadioGroup
          value={draft.metadata.template}
          onValueChange={(templateId) =>
            setDraft((current) =>
              updateDraft(current, (next) => {
                next.metadata.template = templateId
              }),
            )
          }
        >
          {templates.map((template) => (
            <DropdownMenuRadioItem key={template.id} value={template.id}>
              {template.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PreviewStep() {
  const queryClient = useQueryClient()
  const { resume, resumeId, saveResume, isSaving, title } = useResumeEditor()
  const [draft, setDraft] = useState<ResumeDocument>(() =>
    cloneResumeDocument(resume),
  )
  const [pendingChanges, setPendingChanges] = useState<Array<{ section: string; itemId?: string; field: string; original: string; proposed: string }>>([])
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [openPanel, setOpenPanel] = useState<'more' | 'agent' | null>(null)
  const [toolbarWidth, setToolbarWidth] = useState(0)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const lastResumeIdRef = useRef(resumeId)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)

  const pageFormat = draft.metadata.page.format
  const updateScale = useCallback(() => {
    const container = previewContainerRef.current
    if (!container) return
    const containerWidth = container.clientWidth - 32
    const pageWidth = pageSizeMap[pageFormat].width * MM_TO_PX
    const raw = containerWidth / pageWidth
    setPreviewScale(raw >= 0.5 ? Math.min(1, raw) : 1)
  }, [pageFormat])

  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return
    const observer = new ResizeObserver(updateScale)
    observer.observe(container)
    return () => observer.disconnect()
  }, [updateScale])

  useEffect(() => {
    if (lastResumeIdRef.current !== resumeId) {
      lastResumeIdRef.current = resumeId
      setDraft(cloneResumeDocument(resume))
    }
  }, [resume, resumeId])

  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return

    const updateToolbarWidth = () => {
      setToolbarWidth(Math.round(toolbar.getBoundingClientRect().width))
    }

    updateToolbarWidth()

    const observer = new ResizeObserver(updateToolbarWidth)
    observer.observe(toolbar)

    return () => observer.disconnect()
  }, [])

  const showFontFamily = toolbarWidth >= 760
  const showTextColor = toolbarWidth >= 520
  const showHighlightColor = toolbarWidth >= 620
  const showDownloadLabel = toolbarWidth >= 460

  useEffect(() => {
    const hasChanges =
      JSON.stringify(draft) !== JSON.stringify(resume)
    if (!hasChanges) return

    const timer = setTimeout(async () => {
      await saveResume({ resume: draft, title })
    }, 800)

    return () => clearTimeout(timer)
  }, [draft, resume, title, saveResume])

  const textColor = draft.metadata.theme.text
  const highlightColor =
    draft.metadata.theme.highlight ?? draft.metadata.theme.primary

  function handleDownloadPdf() {
    if (typeof window === 'undefined' || isDownloadingPdf) return

    void (async () => {
      setIsDownloadingPdf(true)

      try {
        const response = await api.resumes.downloadPdf(resumeId)
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = downloadUrl
        anchor.download = `${title || 'resume'}.pdf`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.URL.revokeObjectURL(downloadUrl)
      } finally {
        setIsDownloadingPdf(false)
      }
    })()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-16">
      <div ref={previewContainerRef} className="resume-print-root min-h-0 flex-1 overflow-auto rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
        <div className="resume-print-frame mx-auto max-w-[860px]" style={{ zoom: previewScale }}>
          <ResumeRenderer
            resume={draft}
            pendingChanges={pendingChanges.map((c) => ({ ...c, id: `${c.section}-${c.itemId ?? ''}-${c.field}` }))}
          />
        </div>
      </div>

      <TooltipProvider delayDuration={300}>
        <Popover open={openPanel !== null} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <PopoverAnchor asChild>
        <div className={cn(
          "fixed bottom-6 left-1/2 z-50 w-auto max-w-[calc(100%-2rem)] -translate-x-1/2 border border-foreground/10 bg-background/95 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80 **:data-[variant=outline]:border-foreground/15",
          openPanel ? "rounded-b-xl rounded-t-none border-t-0" : "rounded-xl",
        )}>
          <div ref={toolbarRef} className="flex min-w-0 items-center gap-1 px-1.5 py-1.5 sm:gap-1.5 sm:px-2.5 sm:py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="h-8 w-8 shrink-0 px-0"
                  onClick={() => setOpenPanel((prev) => prev === 'agent' ? null : 'agent')}
                >
                  <Icons.Logo className="size-4 rounded-[3px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>AI Agent</p>
              </TooltipContent>
            </Tooltip>

            {showFontFamily && (
              <FontFamilyDropdown draft={draft} setDraft={setDraft} />
            )}

            <FontSizeControls draft={draft} setDraft={setDraft} />

            {showTextColor && (
              <ColorPickerPopover
                value={textColor}
                onChange={(color) =>
                  setDraft((current) =>
                    updateDraft(current, (next) => {
                      next.metadata.theme.text = color
                      next.metadata.theme.primary = color
                    }),
                  )
                }
                label="Text color"
                presets={presetTextColors}
                icon={Type}
              />
            )}

            {showHighlightColor && (
              <ColorPickerPopover
                value={highlightColor}
                onChange={(color) =>
                  setDraft((current) =>
                    updateDraft(current, (next) => {
                      next.metadata.theme.highlight = color
                    }),
                  )
                }
                label="Highlight (backgrounds, borders)"
                presets={presetHighlightColors}
                icon={Highlighter}
              />
            )}

            <div className="min-w-0 flex-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="h-8 shrink-0"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  <Download className="size-4" />
                  <span className={cn(showDownloadLabel ? 'inline' : 'hidden')}>
                    {isDownloadingPdf ? 'Preparing…' : 'Download PDF'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Print or save as PDF</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={openPanel === 'more' ? 'default' : 'outline'}
                  size="default"
                  className="h-8 w-8 shrink-0 px-0"
                  onClick={() => setOpenPanel((prev) => prev === 'more' ? null : 'more')}
                >
                  <Ellipsis className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>More options</p>
              </TooltipContent>
            </Tooltip>

            <PopoverContent
              side="top"
              align="center"
              sideOffset={0}
              className={cn(
                'w-(--radix-popper-anchor-width) rounded-b-none rounded-t-xl border border-foreground/10 ring-0 p-0 shadow-none **:data-[variant=outline]:border-foreground/15',
                openPanel === 'agent'
                  ? 'bg-background'
                  : 'bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80',
              )}
            >
              {openPanel === 'more' && (
                <div className="flex flex-wrap items-center gap-1.5 p-2.5">
                  {!showFontFamily && (
                    <FontFamilyDropdown draft={draft} setDraft={setDraft} />
                  )}

                  {!showTextColor && (
                    <ColorPickerPopover
                      value={textColor}
                      onChange={(color) =>
                        setDraft((current) =>
                          updateDraft(current, (next) => {
                            next.metadata.theme.text = color
                            next.metadata.theme.primary = color
                          }),
                        )
                      }
                      label="Text color"
                      presets={presetTextColors}
                      icon={Type}
                    />
                  )}

                  {!showHighlightColor && (
                    <ColorPickerPopover
                      value={highlightColor}
                      onChange={(color) =>
                        setDraft((current) =>
                          updateDraft(current, (next) => {
                            next.metadata.theme.highlight = color
                          }),
                        )
                      }
                      label="Highlight (backgrounds, borders)"
                      presets={presetHighlightColors}
                      icon={Highlighter}
                    />
                  )}

                  <LineHeightDropdown draft={draft} setDraft={setDraft} />
                  <UnderlineLinksToggle draft={draft} setDraft={setDraft} />
                  <HideIconsToggle draft={draft} setDraft={setDraft} />
                  <PageFormatDropdown draft={draft} setDraft={setDraft} />
                  <PageMarginDropdown draft={draft} setDraft={setDraft} />
                  <TemplatesDropdown draft={draft} setDraft={setDraft} />
                </div>
              )}
              {openPanel === 'agent' && (
                <AgentPanelContent
                  resumeId={resumeId}
                  onPendingChanges={setPendingChanges}
                  onChangesApplied={() => {
                    const approvedChanges = pendingChanges
                    setDraft((current) => applyApprovedChanges(current, approvedChanges))
                    setPendingChanges([])
                    queryClient.invalidateQueries({ queryKey: resumeKeys.detail(resumeId) })
                  }}
                  onChangesRejected={() => setPendingChanges([])}
                />
              )}
            </PopoverContent>
          </div>
        </div>
        </PopoverAnchor>
        </Popover>
      </TooltipProvider>
    </div>
  )
}
