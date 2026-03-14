import { useEffect, useRef, useState } from 'react'
import type { ResumeDocument } from '@repo/core/schemas'
import {
  ChevronDown,
  Download,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/components/ui/tooltip'
import { api } from '#/lib/api'
import { cn } from '#/lib/utils'

import { cloneResumeDocument } from '../../lib/queries'
import { templates } from '../../lib/template-registry'
import { ResumeRenderer } from '../../rendering/resume-renderer'
import { useResumeEditor } from '../resume-editor-context'
import { StepPanel } from '../resume-editor-shell'

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
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-56 p-3">
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

export function PreviewStep() {
  const { resume, resumeId, saveResume, isSaving, title } = useResumeEditor()
  const [draft, setDraft] = useState<ResumeDocument>(() =>
    cloneResumeDocument(resume),
  )
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const lastResumeIdRef = useRef(resumeId)

  useEffect(() => {
    if (lastResumeIdRef.current !== resumeId) {
      lastResumeIdRef.current = resumeId
      setDraft(cloneResumeDocument(resume))
    }
  }, [resume, resumeId])

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
    <StepPanel className="gap-5 overflow-hidden">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Finish up & Preview</h2>
        <p
          className={cn(
            'min-h-5 text-sm text-muted-foreground transition-opacity',
            isSaving ? 'opacity-100' : 'opacity-0',
          )}
          aria-live="polite"
        >
          Saving…
        </p>
      </div>

      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Font family */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="h-8 gap-1.5">
                <Type className="size-4" />
                <span className="max-w-24 truncate">
                  {draft.metadata.typography.font.family}
                </span>
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuRadioGroup
                value={draft.metadata.typography.font.family}
                onValueChange={(family) =>
                  setDraft((current) =>
                    updateDraft(current, (next) => {
                      next.metadata.typography.font.family = family
                      next.metadata.typography.font.variants = [
                        'regular',
                        'italic',
                        '600',
                      ]
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

          {/* Font size */}
          <div className="flex items-center gap-0.5 rounded-lg border border-input bg-background">
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
                        next.metadata.typography.font.size = Math.max(
                          10,
                          next.metadata.typography.font.size - 1,
                        )
                      }),
                    )
                  }
                >
                  <Minus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Decrease font size</p>
              </TooltipContent>
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
                        next.metadata.typography.font.size = Math.min(
                          18,
                          next.metadata.typography.font.size + 1,
                        )
                      }),
                    )
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Increase font size</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Line height */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="h-8 gap-1.5">
                <span className="text-xs font-medium">LH</span>
                {draft.metadata.typography.lineHeight}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[120px]">
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
                  <DropdownMenuRadioItem
                    key={value}
                    value={String(value)}
                  >
                    {value}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Text color */}
          <ColorPickerPopover
            value={textColor}
            onChange={(color) =>
              setDraft((current) =>
                updateDraft(current, (next) => {
                  next.metadata.theme.text = color
                  // Keep the legacy primary field aligned so existing templates
                  // that still use text-primary continue following the text color.
                  next.metadata.theme.primary = color
                }),
              )
            }
            label="Text color"
            presets={presetTextColors}
            icon={Type}
          />

          {/* Highlight color */}
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

          {/* Underline links */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={
                  draft.metadata.typography.underlineLinks ? 'default' : 'outline'
                }
                size="default"
                className="h-8"
                onClick={() =>
                  setDraft((current) =>
                    updateDraft(current, (next) => {
                      next.metadata.typography.underlineLinks =
                        !next.metadata.typography.underlineLinks
                    }),
                  )
                }
              >
                <Underline className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Underline links</p>
            </TooltipContent>
          </Tooltip>

          {/* Hide icons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={
                  draft.metadata.typography.hideIcons ? 'default' : 'outline'
                }
                size="default"
                className="h-8"
                onClick={() =>
                  setDraft((current) =>
                    updateDraft(current, (next) => {
                      next.metadata.typography.hideIcons =
                        !next.metadata.typography.hideIcons
                    }),
                  )
                }
              >
                <FileText className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{draft.metadata.typography.hideIcons ? 'Show icons' : 'Hide icons'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Page format */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="h-8 gap-1.5">
                <Printer className="size-4" />
                {draft.metadata.page.format.toUpperCase()}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[120px]">
              <DropdownMenuRadioGroup
                value={draft.metadata.page.format}
                onValueChange={(format) =>
                  setDraft((current) =>
                    updateDraft(current, (next) => {
                      next.metadata.page.format =
                        format as 'a4' | 'letter'
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

          {/* Page margin */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="h-8 gap-1.5">
                {draft.metadata.page.margin}px
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[100px]">
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

          {/* Templates */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="h-8">
                Templates
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-64">
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
                  <DropdownMenuRadioItem
                    key={template.id}
                    value={template.id}
                  >
                    {template.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Download PDF */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="default"
                className="h-8"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
              >
                <Download className="size-4" />
                {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Print or save as PDF</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <div className="resume-print-root min-h-0 flex-1 overflow-auto rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
        <div className="resume-print-frame mx-auto max-w-[860px]">
          <ResumeRenderer resume={draft} />
        </div>
      </div>
    </StepPanel>
  )
}
