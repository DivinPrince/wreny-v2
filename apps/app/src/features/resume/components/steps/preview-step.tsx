import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { DocumentChange } from '@repo/core/agent'
import { parseAsString, useQueryState } from 'nuqs'
import {
  defaultAward,
  defaultCertification,
  defaultCustomFieldIcon,
  defaultCustomSection,
  defaultEducation,
  defaultExperience,
  defaultInterest,
  defaultLanguage,
  defaultProfile,
  defaultProject,
  defaultPublication,
  defaultReference,
  defaultSkill,
  defaultUrl,
  defaultVolunteer,
} from '@repo/core/schemas'
import type { ResumeDocument } from '@repo/core/schemas'
import {
  ChevronDown,
  Download,
  Ellipsis,
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

import { EditableDocumentTitle } from '#/components/editable-document-title'
import { AgentPanelContent } from '../agent-popover'
import { cloneResumeDocument, resumeKeys } from '../../lib/queries'
import { templates } from '../../lib/template-registry'
import { pageSizeMap } from '../../lib/template-utils'
import { MM_TO_PX } from '../../rendering/page'
import { ResumeRenderer } from '../../rendering/resume-renderer'
import { useResumeEditor } from '../resume-editor-context'
import {
  ensureCustomResumeSection,
  ensureResumeSectionInLayout,
} from '../../lib/resume-layout'

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
  const segments = field.split('.')
  let current: Record<string, unknown> | null = target

  for (const segment of segments.slice(0, -1)) {
    const next = current?.[segment]
    if (!next || typeof next !== 'object') {
      return
    }

    current = next as Record<string, unknown>
  }

  const lastSegment = segments.at(-1)
  if (current && lastSegment && lastSegment in current) {
    current[lastSegment] = value
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean)
  }

  return []
}

function createPreviewResumeItem(section: string, payload: Record<string, unknown>) {
  if (section === 'basics') {
    return {
      id: crypto.randomUUID(),
      icon: typeof payload.icon === 'string' ? payload.icon : defaultCustomFieldIcon,
      name: typeof payload.name === 'string' ? payload.name : '',
      value: typeof payload.value === 'string' ? payload.value : '',
    }
  }

  const base =
    section === 'awards'
      ? structuredClone(defaultAward)
      : section === 'certifications'
        ? structuredClone(defaultCertification)
        : section === 'education'
          ? structuredClone(defaultEducation)
          : section === 'experience'
            ? structuredClone(defaultExperience)
            : section === 'interests'
              ? structuredClone(defaultInterest)
              : section === 'languages'
                ? structuredClone(defaultLanguage)
                : section === 'profiles'
                  ? structuredClone(defaultProfile)
                  : section === 'projects'
                    ? structuredClone(defaultProject)
                    : section === 'publications'
                      ? structuredClone(defaultPublication)
                      : section === 'references'
                        ? structuredClone(defaultReference)
                        : section === 'skills'
                          ? structuredClone(defaultSkill)
                          : section === 'volunteer'
                            ? structuredClone(defaultVolunteer)
                            : section.startsWith('custom.')
                              ? structuredClone(defaultCustomSection)
                              : undefined

  if (!base) {
    return undefined
  }

  const item = {
    ...base,
    ...payload,
    id: typeof payload.id === 'string' && payload.id ? payload.id : crypto.randomUUID(),
    visible: typeof payload.visible === 'boolean' ? payload.visible : true,
  } as Record<string, unknown>

  if ('url' in item) {
    item.url = {
      ...defaultUrl,
      ...(isRecord(payload.url) ? payload.url : {}),
    }
  }

  if ('keywords' in item) {
    item.keywords = normalizeStringArray(payload.keywords ?? item.keywords)
  }

  return item
}

function applyApprovedChanges(
  current: ResumeDocument,
  changes: DocumentChange[],
) {
  return updateDraft(current, (next) => {
    for (const change of changes) {
      const { operation, section, itemId, field, proposed } = change

      if (operation === 'add-item') {
        if (section === 'summary') {
          next.sections.summary.content = proposed
          next.sections.summary.visible = true
          ensureResumeSectionInLayout(next, section)
          continue
        }

        if (section === 'basics') {
          const payload = parseJsonRecord(proposed)
          if (!payload) {
            continue
          }

          const item = createPreviewResumeItem(section, payload)
          if (item) {
            next.basics.customFields.push(item as typeof next.basics.customFields[number])
          }
          continue
        }

        ensureCustomResumeSection(next, section)
        const sectionGroup = getSectionGroup(next, section)
        const payload = field === '__item__' ? parseJsonRecord(proposed) : undefined
        if (!sectionGroup || !('items' in sectionGroup) || !payload) {
          continue
        }

        const item = createPreviewResumeItem(section, payload)
        if (!item) {
          continue
        }

        ;(sectionGroup.items as Array<Record<string, unknown>>).push(item)
        sectionGroup.visible = true
        ensureResumeSectionInLayout(next, section)
        continue
      }

      if (operation === 'delete-item') {
        if (section === 'basics' && itemId) {
          next.basics.customFields = next.basics.customFields.filter(
            (fieldEntry) => fieldEntry.id !== itemId,
          )
          continue
        }

        const sectionGroup = getSectionGroup(next, section)
        if (sectionGroup && 'items' in sectionGroup && itemId) {
          const items = sectionGroup.items as Array<{ id: string }>
          sectionGroup.items = items.filter((entry) => entry.id !== itemId) as typeof sectionGroup.items
        }
        continue
      }

      if (operation === 'set-section-visible') {
        if (proposed !== 'true' && proposed !== 'false') {
          continue
        }

        const visible = proposed === 'true'

        if (section === 'summary') {
          next.sections.summary.visible = visible
          continue
        }

        const sectionGroup = getSectionGroup(next, section)
        if (sectionGroup && 'visible' in sectionGroup) {
          sectionGroup.visible = visible
          if (visible) {
            ensureResumeSectionInLayout(next, section)
          }
        }
        continue
      }

      if (section === 'basics') {
        if (itemId) {
          const item = next.basics.customFields.find((entry) => entry.id === itemId)
          if (item) {
            setDocumentField(item as Record<string, unknown>, field, proposed)
          }
          continue
        }

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

      const items = sectionGroup.items as Array<{ id: string }>
      const item = items.find((entry) => entry.id === itemId)
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
          <Icons.File className="size-4" />
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
  const [sessionId, setSessionId] = useQueryState(
    'sessionId',
    parseAsString.withOptions({ history: 'replace' }),
  )
  const { resume, resumeId, saveResume, title } = useResumeEditor()
  const [draft, setDraft] = useState<ResumeDocument>(() =>
    cloneResumeDocument(resume),
  )
  const [draftTitle, setDraftTitle] = useState(title)
  const [isTitleEditing, setIsTitleEditing] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<DocumentChange[]>([])
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [openPanel, setOpenPanel] = useState<'more' | 'agent' | null>(null)
  const [startNewChat, setStartNewChat] = useState(false)
  const [toolbarWidth, setToolbarWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const lastResumeIdRef = useRef(resumeId)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const setAgentSessionId = useCallback(
    (nextSessionId: string) => {
      setStartNewChat(false)
      if (sessionId === nextSessionId) {
        return
      }
      void setSessionId(nextSessionId)
    },
    [sessionId, setSessionId],
  )
  const handleNewChat = useCallback(() => {
    setPendingChanges([])
    setStartNewChat(true)
    void setSessionId(null)
  }, [setSessionId])

  useEffect(() => {
    if (sessionId) {
      setStartNewChat(false)
    }
  }, [sessionId])

  useEffect(() => {
    setStartNewChat(false)
  }, [resumeId])

  useEffect(() => {
    setPendingChanges([])
  }, [sessionId, startNewChat])

  const pageFormat = draft.metadata.page.format
  const previewDraft =
    pendingChanges.length > 0
      ? applyApprovedChanges(draft, pendingChanges)
      : draft
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
      setDraftTitle(title)
    }
  }, [resume, resumeId, title])

  useEffect(() => {
    setDraftTitle(title)
  }, [title])

  useEffect(() => {
    const onResize = () => setToolbarWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const showFontFamily = toolbarWidth >= 520
  const showTextColor = toolbarWidth >= 360
  const showHighlightColor = toolbarWidth >= 440

  useEffect(() => {
    const hasResumeChanges =
      JSON.stringify(draft) !== JSON.stringify(resume)
    const hasTitleChanges = draftTitle.trim() !== title.trim()
    if (!hasResumeChanges && !hasTitleChanges) return

    const timer = setTimeout(async () => {
      await saveResume({
        resume: draft,
        title: draftTitle.trim() || 'Untitled Resume',
      })
    }, 800)

    return () => clearTimeout(timer)
  }, [draft, draftTitle, resume, title, saveResume])

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
        anchor.download = `${draftTitle.trim() || 'resume'}.pdf`
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
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-16">
      <EditableDocumentTitle
        value={draftTitle}
        placeholder="Untitled Resume"
        ariaLabel="Resume title"
        active={isTitleEditing}
        onChange={setDraftTitle}
        onActivate={() => setIsTitleEditing(true)}
        onDeactivate={() => setIsTitleEditing(false)}
      />

      <div ref={previewContainerRef} className="resume-print-root min-h-0 flex-1 overflow-auto rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
        <div
          className="resume-print-frame mx-auto w-full min-w-0 max-w-[860px]"
          style={{ zoom: previewScale }}
        >
          <ResumeRenderer
            resume={previewDraft}
            pendingChanges={pendingChanges.map((c) => ({
              ...c,
              id: `${c.operation}-${c.section}-${c.itemId ?? ''}-${c.field}`,
            }))}
          />
        </div>
      </div>

      <TooltipProvider delayDuration={300}>
        <Popover open={openPanel !== null} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <PopoverAnchor asChild>
        <div className={cn(
          "fixed bottom-6 left-1/2 z-50 w-auto min-w-[min(520px,calc(100vw-2rem))] max-w-[calc(100%-2rem)] -translate-x-1/2 border border-foreground/10 bg-background/95 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80 **:data-[variant=outline]:border-foreground/15",
          openPanel ? "rounded-b-xl rounded-t-none border-t-0" : "rounded-xl",
        )}>
          <div ref={toolbarRef} className="flex items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="h-8 w-8 shrink-0 px-0"
                  onClick={() => setOpenPanel((prev) => prev === 'agent' ? null : 'agent')}
                >
                  <Icons.AiBeautify className="size-4" />
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
                  className="h-8 w-8 shrink-0 px-0"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  aria-label={isDownloadingPdf ? 'Preparing PDF' : 'Download PDF'}
                >
                  <Download className="size-4" />
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
                  sessionId={sessionId ?? null}
                  startNewSession={startNewChat}
                  onSessionIdChange={setAgentSessionId}
                  onNewChat={handleNewChat}
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
