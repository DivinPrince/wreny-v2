import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Download, Plus } from 'lucide-react'

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
import { api } from '#/lib/api'
import { cn } from '#/lib/utils'

import { cloneCoverLetterDocument } from '../lib/queries'
import { templates } from '../lib/template-registry'
import { CoverLetterRenderer } from '../rendering/cover-letter-renderer'
import type { CoverLetterEditorBindings } from '../templates/types'
import { useCoverLetterEditor } from './cover-letter-editor-context'
import { InlineEditable } from './inline-editable'

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

export function EditableLetterView() {
  const { coverLetter, coverLetterId, saveCoverLetter, isSaving, title } =
    useCoverLetterEditor()
  const [draft, setDraft] = useState<CoverLetterDocument>(() =>
    cloneCoverLetterDocument(coverLetter),
  )
  const [draftTitle, setDraftTitle] = useState(title)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const lastCoverLetterIdRef = useRef(coverLetterId)
  const draftRef = useRef(draft)
  const draftTitleRef = useRef(draftTitle)
  const validationMessage = useMemo(() => getValidationMessage(draft), [draft])

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
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          <InlineEditable
            element="span"
            value={draftTitle}
            placeholder="Untitled Cover Letter"
            ariaLabel="Cover letter title"
            active={activeField === 'title'}
            onActivate={() => setActiveField('title')}
            onChange={setDraftTitle}
            onDeactivate={() => setActiveField(null)}
            displayClassName="inline rounded-md px-1.5 py-0.5"
            editorClassName="h-11 max-w-xl text-base font-semibold"
          />
        </h1>

        <TooltipProvider delayDuration={300}>
          <div className="cover-letter-toolbar">
            <div className="cover-letter-toolbar-group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className="h-8 gap-1.5 px-2.5"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          templates.find(
                            (template) => template.id === draft.metadata.template,
                          )?.accent ?? '#1f2937',
                      }}
                    />
                    <span className="max-w-24 truncate">
                      {templates.find(
                        (template) => template.id === draft.metadata.template,
                      )?.name ?? 'Classic'}
                    </span>
                    <ChevronDown className="size-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[220px]">
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
                    variant="ghost"
                    size="icon-xs"
                    className="h-8 w-8"
                    onClick={handleAddParagraph}
                  >
                    <Plus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Add paragraph</p>
                </TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className="h-8 px-2.5 text-sm"
                  >
                    Details
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[380px] space-y-4 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="cover-letter-notes">Positioning note</Label>
                    <Textarea
                      id="cover-letter-notes"
                      value={draft.metadata.notes}
                      onChange={(event) =>
                        handleChangeField('metadata.notes', event.target.value)
                      }
                      className="min-h-24"
                      placeholder="Capture the angle for this version..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <div className="flex flex-wrap gap-2">
                      {toneOptions.map((tone) => (
                        <Button
                          key={tone}
                          type="button"
                          variant={
                            draft.context.tone === tone ? 'default' : 'outline'
                          }
                          onClick={() => handleChangeTone(tone)}
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
                        handleChangeField('context.jobUrl', event.target.value)
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
                          handleChangeField('sender.url.label', event.target.value)
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
                          handleChangeField('sender.url.href', event.target.value)
                        }
                        placeholder="https://yoursite.com"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="cover-letter-toolbar-group">
              <Button
                type="button"
                variant="ghost"
                size="default"
                className="h-8 gap-1.5 px-2.5"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
              >
                <Download className="size-4" />
                {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </TooltipProvider>

        <p className="text-sm text-muted-foreground">
          Hover any text in the letter, click once, and type directly in place.
        </p>
      </div>

      <p
        className={cn(
          'min-h-5 text-sm transition-colors',
          validationMessage ? 'text-amber-600' : 'text-muted-foreground',
        )}
        aria-live="polite"
      >
        {validationMessage ?? (isSaving ? 'Saving...' : '')}
      </p>

      <div className="cover-letter-print-root min-h-0 flex-1 overflow-auto border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
        <div className="cover-letter-print-frame mx-auto max-w-[860px]">
          <div className="cover-letter-stage">
            <CoverLetterRenderer
              coverLetter={draft}
              mode="editor"
              editor={editorBindings}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
