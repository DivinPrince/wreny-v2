import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Download, Ellipsis, Plus } from 'lucide-react'

import type { DocumentChange } from '@repo/core/agent'
import type {
  CoverLetterContext,
  CoverLetterDocument,
} from '@repo/core/schemas'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Textarea } from '#/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { Icons } from '#/components/ui/icons'
import { api } from '#/lib/api'
import { cn } from '#/lib/utils'

import { EditableDocumentTitle } from '#/components/editable-document-title'
import { AgentPanelContent } from './agent-popover'
import { cloneCoverLetterDocument, coverLetterKeys } from '../lib/queries'
import { templates } from '../lib/template-registry'
import {
  COVER_LETTER_PAGE_WIDTH_PX,
  CoverLetterRenderer,
} from '../rendering/cover-letter-renderer'
import type { CoverLetterEditorBindings } from '../templates/types'
import { useCoverLetterEditor } from './cover-letter-editor-context'

const toneOptions: ReadonlyArray<CoverLetterContext['tone']> = [
  'professional',
  'confident',
  'friendly',
]

type EditableFieldId =
  | 'metadata.notes'
  | 'context.companyName'
  | 'context.jobTitle'
  | 'context.jobUrl'
  | 'context.tone'
  | 'sender.name'
  | 'sender.email'
  | 'sender.phone'
  | 'sender.location'
  | 'sender.title'
  | 'sender.url.label'
  | 'sender.url.href'
  | 'recipient.name'
  | 'recipient.title'
  | 'recipient.companyName'
  | 'recipient.location'
  | 'recipient.email'
  | 'content.greeting'
  | 'content.opening'
  | 'content.closing'
  | 'content.signature'
  | `content.body.${number}`

function updateDraft(
  current: CoverLetterDocument,
  updater: (draft: CoverLetterDocument) => void,
) {
  const next = cloneCoverLetterDocument(current)
  updater(next)
  return next
}

function isBlankOrValidEmail(value: string) {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return true
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function isBlankOrValidUrl(value: string) {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return true
  }

  try {
    new URL(trimmed)
    return true
  } catch {
    return false
  }
}

function getValidationMessage(draft: CoverLetterDocument) {
  if (!isBlankOrValidEmail(draft.sender.email)) {
    return 'Finish the sender email before autosave can continue.'
  }

  if (!isBlankOrValidEmail(draft.recipient.email)) {
    return 'Finish the recipient email before autosave can continue.'
  }

  if (!isBlankOrValidUrl(draft.sender.url.href)) {
    return 'Finish the portfolio URL before autosave can continue.'
  }

  if (!isBlankOrValidUrl(draft.context.jobUrl)) {
    return 'Finish the job URL before autosave can continue.'
  }

  return null
}

function applyFieldChange(
  current: CoverLetterDocument,
  fieldId: EditableFieldId,
  value: string,
) {
  return updateDraft(current, (next) => {
    if (fieldId.startsWith('content.body.')) {
      const index = Number(fieldId.split('.').at(-1))

      while (next.content.body.length <= index) {
        next.content.body.push('')
      }

      next.content.body[index] = value
      return
    }

    switch (fieldId) {
      case 'metadata.notes':
        next.metadata.notes = value
        return
      case 'context.companyName':
        next.context.companyName = value
        next.recipient.companyName = value
        return
      case 'context.jobTitle':
        next.context.jobTitle = value
        return
      case 'context.jobUrl':
        next.context.jobUrl = value
        return
      case 'context.tone':
        next.context.tone = value as CoverLetterContext['tone']
        return
      case 'sender.name':
        next.sender.name = value
        return
      case 'sender.email':
        next.sender.email = value
        return
      case 'sender.phone':
        next.sender.phone = value
        return
      case 'sender.location':
        next.sender.location = value
        return
      case 'sender.title':
        next.sender.title = value
        return
      case 'sender.url.label':
        next.sender.url.label = value
        return
      case 'sender.url.href':
        next.sender.url.href = value
        return
      case 'recipient.name':
        next.recipient.name = value
        return
      case 'recipient.title':
        next.recipient.title = value
        return
      case 'recipient.companyName':
        next.recipient.companyName = value
        next.context.companyName = value
        return
      case 'recipient.location':
        next.recipient.location = value
        return
      case 'recipient.email':
        next.recipient.email = value
        return
      case 'content.greeting':
        next.content.greeting = value
        return
      case 'content.opening':
        next.content.opening = value
        return
      case 'content.closing':
        next.content.closing = value
        return
      case 'content.signature':
        next.content.signature = value
        return
      default:
        throw new Error(`Unhandled editable field: ${String(fieldId)}`)
    }
  })
}

function applyApprovedChanges(
  current: CoverLetterDocument,
  changes: DocumentChange[],
) {
  return updateDraft(current, (next) => {
    for (const change of changes) {
      const { operation, section, itemId, field, proposed } = change

      if (operation === 'add-item') {
        if (section === 'content' && field === 'body') {
          const index =
            itemId == null ? next.content.body.length : Number(itemId)

          if (Number.isInteger(index) && index >= 0) {
            next.content.body.splice(index, 0, proposed)
          } else {
            next.content.body.push(proposed)
          }
        }
        continue
      }

      if (section === 'sender') {
        setDocumentField(next.sender as Record<string, unknown>, field, proposed)
        continue
      }

      if (section === 'recipient') {
        setDocumentField(next.recipient as Record<string, unknown>, field, proposed)
        if (field === 'companyName') {
          next.context.companyName = proposed
        }
        continue
      }

      if (section === 'context') {
        setDocumentField(next.context as Record<string, unknown>, field, proposed)
        if (field === 'companyName') {
          next.recipient.companyName = proposed
        }
        continue
      }

      if (section === 'metadata') {
        setDocumentField(next.metadata as Record<string, unknown>, field, proposed)
        continue
      }

      if (section === 'content') {
        if (field === 'body' && itemId != null) {
          const index = Number(itemId)
          if (Number.isInteger(index) && index >= 0) {
            while (next.content.body.length <= index) {
              next.content.body.push('')
            }
            next.content.body[index] = proposed
          }
          continue
        }

        switch (field) {
          case 'greeting':
            next.content.greeting = proposed
            break
          case 'opening':
            next.content.opening = proposed
            break
          case 'closing':
            next.content.closing = proposed
            break
          case 'signature':
            next.content.signature = proposed
            break
          default:
            break
        }
      }
    }
  })
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

function DetailsPopover({
  draft,
  onChangeField,
  onChangeTone,
}: {
  draft: CoverLetterDocument
  onChangeField: (fieldId: EditableFieldId, value: string) => void
  onChangeTone: (tone: CoverLetterContext['tone']) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="h-8 shrink-0 px-2.5 text-sm"
        >
          Details
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" side="top" sideOffset={12} className="w-[380px] space-y-4 border-foreground/10 bg-background/95 p-4 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="space-y-2">
          <Label htmlFor="cover-letter-notes">Focus</Label>
          <Textarea
            id="cover-letter-notes"
            value={draft.metadata.notes}
            onChange={(event) =>
              onChangeField('metadata.notes', event.target.value)
            }
            className="min-h-24"
            placeholder="Why this role matters to you."
          />
        </div>

        <div className="space-y-2">
          <Label>Tone</Label>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((tone) => (
              <Button
                key={tone}
                type="button"
                variant={draft.context.tone === tone ? 'default' : 'outline'}
                onClick={() => onChangeTone(tone)}
              >
                {tone[0].toUpperCase()}
                {tone.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover-letter-job-url">Job listing URL</Label>
          <Input
            id="cover-letter-job-url"
            value={draft.context.jobUrl}
            onChange={(event) =>
              onChangeField('context.jobUrl', event.target.value)
            }
            placeholder="https://company.com/careers/role"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cover-letter-site-label">Website label</Label>
            <Input
              id="cover-letter-site-label"
              value={draft.sender.url.label}
              onChange={(event) =>
                onChangeField('sender.url.label', event.target.value)
              }
              placeholder="Portfolio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover-letter-site-url">Website URL</Label>
            <Input
              id="cover-letter-site-url"
              value={draft.sender.url.href}
              onChange={(event) =>
                onChangeField('sender.url.href', event.target.value)
              }
              placeholder="https://yoursite.com"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function EditableLetterView() {
  const queryClient = useQueryClient()
  const { coverLetter, coverLetterId, saveCoverLetter, title } =
    useCoverLetterEditor()
  const [draft, setDraft] = useState<CoverLetterDocument>(() =>
    cloneCoverLetterDocument(coverLetter),
  )
  const [draftTitle, setDraftTitle] = useState(title)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<DocumentChange[]>([])
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [openPanel, setOpenPanel] = useState<'more' | 'agent' | null>(null)
  const [toolbarWidth, setToolbarWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const lastCoverLetterIdRef = useRef(coverLetterId)
  const draftRef = useRef(draft)
  const draftTitleRef = useRef(draftTitle)
  const validationMessage = useMemo(() => getValidationMessage(draft), [draft])

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const previewDraft =
    pendingChanges.length > 0
      ? applyApprovedChanges(draft, pendingChanges)
      : draft

  const updateScale = useCallback(() => {
    const container = previewContainerRef.current
    if (!container) return
    const containerWidth = container.clientWidth - 32
    const raw = containerWidth / COVER_LETTER_PAGE_WIDTH_PX
    setPreviewScale(raw >= 0.5 ? Math.min(1, raw) : 1)
  }, [])

  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return
    const observer = new ResizeObserver(updateScale)
    observer.observe(container)
    return () => observer.disconnect()
  }, [updateScale])

  useEffect(() => {
    const onResize = () => setToolbarWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const showDetails = toolbarWidth >= 480

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    draftTitleRef.current = draftTitle
  }, [draftTitle])

  useEffect(() => {
    if (lastCoverLetterIdRef.current !== coverLetterId) {
      lastCoverLetterIdRef.current = coverLetterId
      setDraft(cloneCoverLetterDocument(coverLetter))
      setDraftTitle(title)
      setActiveField(null)
      return
    }

    const hasLocalDraftChanges =
      JSON.stringify(draftRef.current) !== JSON.stringify(coverLetter)
    const hasLocalTitleChanges =
      draftTitleRef.current.trim() !== title.trim()

    if (hasLocalDraftChanges || hasLocalTitleChanges) {
      return
    }

    setDraft(cloneCoverLetterDocument(coverLetter))
    setDraftTitle(title)
  }, [coverLetter, coverLetterId, title])

  useEffect(() => {
    const hasCoverLetterChanges =
      JSON.stringify(draft) !== JSON.stringify(coverLetter)
    const hasTitleChanges = draftTitle.trim() !== title.trim()

    if (!hasCoverLetterChanges && !hasTitleChanges) {
      return
    }

    if (validationMessage) {
      return
    }

    const timer = setTimeout(async () => {
      await saveCoverLetter({
        coverLetter: draft,
        title: draftTitle.trim() || 'Untitled Cover Letter',
      })
    }, 700)

    return () => clearTimeout(timer)
  }, [coverLetter, draft, draftTitle, saveCoverLetter, title, validationMessage])

  function handleChangeField(fieldId: EditableFieldId, value: string) {
    setDraft((current) => applyFieldChange(current, fieldId, value))
  }

  function handleChangeTone(tone: CoverLetterContext['tone']) {
    handleChangeField('context.tone', tone)
  }

  function handleAddParagraph() {
    const nextIndex = draft.content.body.length

    setDraft((current) =>
      updateDraft(current, (next) => {
        next.content.body.push('')
      }),
    )
    setActiveField(`content.body.${nextIndex}`)
  }

  function handleRemoveParagraph(index: number) {
    setDraft((current) =>
      updateDraft(current, (next) => {
        next.content.body =
          next.content.body.length <= 1
            ? ['']
            : next.content.body.filter(
                (_, paragraphIndex) => paragraphIndex !== index,
              )
      }),
    )
    setActiveField(null)
  }

  function handleDownloadPdf() {
    if (typeof window === 'undefined' || isDownloadingPdf) {
      return
    }

    void (async () => {
      setIsDownloadingPdf(true)

      try {
        const response = await api.coverLetters.downloadPdf(coverLetterId)
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = downloadUrl
        anchor.download = `${draftTitle.trim() || 'cover-letter'}.pdf`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.URL.revokeObjectURL(downloadUrl)
      } finally {
        setIsDownloadingPdf(false)
      }
    })()
  }

  const editorBindings: CoverLetterEditorBindings = {
    activeField,
    onActivateField: setActiveField,
    onDeactivateField: () => setActiveField(null),
    onChangeField: (fieldId, value) =>
      handleChangeField(fieldId as EditableFieldId, value),
    onAddBodyParagraph: handleAddParagraph,
    onRemoveBodyParagraph: handleRemoveParagraph,
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-16">
      <EditableDocumentTitle
        value={draftTitle}
        placeholder="Untitled Cover Letter"
        ariaLabel="Cover letter title"
        active={activeField === 'title'}
        onChange={setDraftTitle}
        onActivate={() => setActiveField('title')}
        onDeactivate={() => setActiveField(null)}
        validationMessage={
          validationMessage && pendingChanges.length === 0 ? (
            <p className="shrink-0 text-sm text-amber-600">{validationMessage}</p>
          ) : undefined
        }
      />

      <div
        ref={previewContainerRef}
        className="cover-letter-print-root min-h-0 flex-1 overflow-auto rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4"
      >
        <div
          className="cover-letter-print-frame mx-auto max-w-[860px]"
          style={{ zoom: previewScale }}
        >
          <div className="cover-letter-stage">
            <CoverLetterRenderer
              coverLetter={previewDraft}
              mode={pendingChanges.length > 0 ? 'preview' : 'editor'}
              editor={pendingChanges.length > 0 ? undefined : editorBindings}
              pendingChanges={pendingChanges}
            />
          </div>
        </div>
      </div>

      <TooltipProvider delayDuration={300}>
        <Popover
          open={openPanel !== null}
          onOpenChange={(open) => {
            if (!open) {
              setOpenPanel(null)
            }
          }}
        >
          <PopoverAnchor asChild>
            <div className={cn(
              "fixed bottom-6 left-1/2 z-50 w-auto min-w-[min(520px,calc(100vw-2rem))] max-w-[calc(100%-2rem)] -translate-x-1/2 border border-foreground/10 bg-background/95 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80 **:data-[variant=outline]:border-foreground/15",
              openPanel ? "rounded-b-xl rounded-t-none border-t-0" : "rounded-xl",
            )}>
              <div className="flex items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-8 w-8 shrink-0 px-0"
                      onClick={() =>
                        setOpenPanel((prev) => prev === 'agent' ? null : 'agent')
                      }
                    >
                      <Icons.Logo className="size-4 rounded-[3px]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>AI Agent</p></TooltipContent>
                </Tooltip>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="default"
                        className="h-8 shrink-0 gap-1.5 px-2.5"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              templates.find(
                                (t) => t.id === draft.metadata.template,
                              )?.accent ?? '#1f2937',
                          }}
                        />
                        <span className="hidden max-w-24 truncate sm:inline">
                          {templates.find(
                            (t) => t.id === draft.metadata.template,
                          )?.name ?? 'Classic'}
                        </span>
                        <ChevronDown className="size-3.5 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="min-w-[220px]">
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-8 w-8 shrink-0 px-0"
                      onClick={handleAddParagraph}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>Add paragraph</p></TooltipContent>
                </Tooltip>

                {showDetails && (
                  <DetailsPopover
                    draft={draft}
                    onChangeField={handleChangeField}
                    onChangeTone={handleChangeTone}
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
                  <TooltipContent side="top"><p>Print or save as PDF</p></TooltipContent>
                </Tooltip>

                {!showDetails && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={openPanel === 'more' ? 'default' : 'outline'}
                          size="default"
                          className="h-8 w-8 shrink-0 px-0"
                          onClick={() =>
                            setOpenPanel((prev) => prev === 'more' ? null : 'more')
                          }
                        >
                          <Ellipsis className="size-4" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top"><p>More options</p></TooltipContent>
                  </Tooltip>
                )}
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
                      {!showDetails && (
                        <DetailsPopover
                          draft={draft}
                          onChangeField={handleChangeField}
                          onChangeTone={handleChangeTone}
                        />
                      )}
                    </div>
                  )}
                  {openPanel === 'agent' && (
                    <AgentPanelContent
                      coverLetterId={coverLetterId}
                      onPendingChanges={setPendingChanges}
                      onChangesApplied={() => {
                        const approvedChanges = pendingChanges
                        setDraft((current) =>
                          applyApprovedChanges(current, approvedChanges),
                        )
                        setPendingChanges([])
                        queryClient.invalidateQueries({
                          queryKey: coverLetterKeys.detail(coverLetterId),
                        })
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
