import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { ArrowUp, Check, Eye, Paperclip, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { DocumentChange, ResumeAgentUIMessage } from '@repo/core/agent'

import { AgentMarkdown } from '#/components/ui/agent-markdown'
import { AutosizeTextarea } from '#/components/ui/autosize-textarea'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { cn } from '#/lib/utils'

import {
  AgentDashboardDocumentPreview,
  AgentOpenInBuilderLink,
} from '#/features/agent/agent-dashboard-document-preview'
import { agentDocumentPreviewAsideWidthClass } from '#/features/agent/agent-preview-layout'
import {
  AgentPageAttachControls,
  type PageDocumentAttachment,
} from '#/features/agent/agent-page-attach-controls'

export type AgentChatPanelLayout = 'popover' | 'page'

export type AgentChatPlaceholders = {
  initial: string
  active: string
  approval: string
  awaitingFollowUp: string
}

const PAGE_COMPOSER_TITLE =
  'Enter to send. Shift+Enter adds a new line.'

/** Side-by-side document preview with chat from this breakpoint up (Tailwind `md`). */
const AGENT_PREVIEW_SPLIT_MIN_PX = 768

function subscribeMdUp(callback: () => void) {
  const mq = window.matchMedia(`(min-width: ${AGENT_PREVIEW_SPLIT_MIN_PX}px)`)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getMdUpSnapshot() {
  return window.matchMedia(`(min-width: ${AGENT_PREVIEW_SPLIT_MIN_PX}px)`).matches
}

function getServerMdUpSnapshot() {
  return true
}

function useMdUp() {
  return useSyncExternalStore(subscribeMdUp, getMdUpSnapshot, getServerMdUpSnapshot)
}

function dashboardAttachmentUserPrefix(
  kind: 'resume' | 'coverLetter',
  title: string,
  id: string,
): string {
  if (kind === 'resume') {
    return `The user attached the dashboard resume "${title}". Use documentType "resume" and documentId "${id}" when calling getResume or proposeDocumentChanges for this document.\n\n`
  }
  return `The user attached the dashboard cover letter "${title}". Use documentType "coverLetter" and documentId "${id}" when calling getCoverLetter or proposeDocumentChanges for this document.\n\n`
}

function splitDashboardAttachmentUserText(full: string): {
  kind: 'resume' | 'coverLetter'
  id: string
  title: string
  body: string
} | null {
  const resumeLead = 'The user attached the dashboard resume "'
  const coverLead = 'The user attached the dashboard cover letter "'
  const kind: 'resume' | 'coverLetter' | null = full.startsWith(resumeLead)
    ? 'resume'
    : full.startsWith(coverLead)
      ? 'coverLetter'
      : null
  if (!kind) return null

  const titleStart = kind === 'resume' ? resumeLead.length : coverLead.length
  const titleEnd = full.indexOf('". Use documentType "', titleStart)
  if (titleEnd === -1) return null
  const title = full.slice(titleStart, titleEnd)
  if (!title) return null

  const idKey = 'documentId "'
  const idKeyAt = full.indexOf(idKey, titleEnd)
  if (idKeyAt === -1) return null
  const idValueStart = idKeyAt + idKey.length
  const idValueEnd = full.indexOf('" when calling', idValueStart)
  if (idValueEnd === -1) return null
  const id = full.slice(idValueStart, idValueEnd)

  const expectedPrefix = dashboardAttachmentUserPrefix(kind, title, id)
  if (!full.startsWith(expectedPrefix)) return null

  return { kind, id, title, body: full.slice(expectedPrefix.length) }
}

function UserMessageContent({
  text,
  onOpenAttachmentPreview,
}: Readonly<{
  text: string
  onOpenAttachmentPreview: (doc: PageDocumentAttachment) => void
}>) {
  const split = splitDashboardAttachmentUserText(text)
  if (!split) {
    return (
      <span className="wrap-break-word whitespace-pre-wrap">{text}</span>
    )
  }
  const chipLabel =
    split.kind === 'resume'
      ? `Resume · ${split.title}`
      : `Cover letter · ${split.title}`

  const attachment: PageDocumentAttachment = {
    kind: split.kind,
    id: split.id,
    title: split.title,
  }

  const builderLinkClass =
    'text-[11px] font-medium text-primary-foreground/90 underline-offset-2 hover:underline'

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-primary-foreground/25 bg-primary-foreground/12 py-1 pl-2.5 pr-2 text-[11px] text-primary-foreground"
        title={chipLabel}
      >
        <Paperclip className="size-3 shrink-0 opacity-80" aria-hidden />
        <span className="min-w-0 truncate font-semibold tracking-tight">
          {chipLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px] font-semibold text-primary-foreground hover:bg-primary-foreground/15"
          onClick={() => onOpenAttachmentPreview(attachment)}
        >
          <Eye className="size-3.5 shrink-0 opacity-90" aria-hidden />
          Preview
        </Button>
        {split.kind === 'resume' ? (
          <Link
            to="/dashboard/resumes/$id/$step"
            params={{ id: split.id, step: 'preview' }}
            className={builderLinkClass}
          >
            Open in builder
          </Link>
        ) : (
          <Link
            to="/dashboard/cover-letters/$id/$step"
            params={{ id: split.id, step: 'preview' }}
            className={builderLinkClass}
          >
            Open in builder
          </Link>
        )}
      </div>
      {split.body ? (
        <span className="wrap-break-word whitespace-pre-wrap">{split.body}</span>
      ) : null}
    </div>
  )
}

function PagePromptShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-xl shrink-0 pb-3 pt-1', className)}>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/25 dark:bg-muted/20">
        {children}
      </div>
    </div>
  )
}

/** Sits in document flow under the scroll region so width matches the dashboard inset (sidebar + preview spacer). */
function pageComposerStripClassName() {
  return cn(
    'z-10 shrink-0 border-t border-border/50 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] supports-backdrop-filter:backdrop-blur-md dark:shadow-[0_-8px_30px_rgba(0,0,0,0.25)]',
  )
}

function getApprovalFollowUpLabel(approvalInFlight: {
  approved: boolean
  id: string
} | null) {
  if (!approvalInFlight) {
    return 'Thinking...'
  }

  return approvalInFlight.approved
    ? 'Applying changes and waiting for AI follow-up...'
    : 'Sending your rejection and waiting for AI follow-up...'
}

function hasRenderableAssistantContent(
  parts: Array<{ type: string; [key: string]: unknown }>,
) {
  return parts.some((part) => {
    if (part.type === 'text' && 'text' in part) {
      return Boolean(part.text)
    }

    if (!part.type?.toString().startsWith('tool-') || !('state' in part)) {
      return false
    }

    if (part.type === 'tool-proposeDocumentChanges') {
      return part.state === 'approval-requested'
    }

    return part.state === 'input-streaming' || part.state === 'input-available'
  })
}

export type AgentPanelChatProps = {
  layout?: AgentChatPanelLayout
  /** Scroll region max height for popover layouts (resume vs cover letter differ). Ignored when layout is `page`. */
  messagesScrollClassName?: string
  isNewSession: boolean
  messages: ResumeAgentUIMessage[]
  sendMessage: (content: { text: string }) => void
  status: string
  addToolApprovalResponse: (args: {
    id: string
    approved: boolean
    reason?: string
  }) => void
  onPendingChanges: (changes: DocumentChange[]) => void
  onChangesApplied: () => void
  onChangesRejected: () => void
  placeholders: AgentChatPlaceholders
  /** When layout is `page` and `isNewSession`, optional hero line above the composer */
  pageHero?: {
    title: string
    subtitle?: string
  }
}

export function AgentPanelChat({
  layout = 'popover',
  messagesScrollClassName = 'max-h-[152px]',
  isNewSession,
  messages,
  sendMessage,
  status,
  addToolApprovalResponse,
  onPendingChanges,
  onChangesApplied,
  onChangesRejected,
  placeholders,
  pageHero,
}: AgentPanelChatProps) {
  const mdUp = useMdUp()
  const [input, setInput] = useState('')
  const [pageAttachment, setPageAttachment] = useState<PageDocumentAttachment | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<PageDocumentAttachment | null>(null)
  const [approvalInFlight, setApprovalInFlight] = useState<{
    approved: boolean
    id: string
  } | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)

  const scrollMessagesToEnd = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = messagesScrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const lastMessage = messages.at(-1)
  const hasPendingApproval = messages.some((message) =>
    message.parts.some(
      (part) =>
        typeof part.type === 'string' &&
        part.type.startsWith('tool-') &&
        'state' in part &&
        part.state === 'approval-requested',
    ),
  )
  const isAwaitingApprovalFollowUp =
    approvalInFlight !== null &&
    (status === 'streaming' || status === 'submitted')
  const isComposerDisabled =
    hasPendingApproval || status === 'streaming' || status === 'submitted'
  const latestAssistantMessageIsEmpty =
    lastMessage?.role === 'assistant' &&
    !hasRenderableAssistantContent(
      lastMessage.parts as Array<{ type: string; [key: string]: unknown }>,
    )
  const showLoadingBubble =
    !hasPendingApproval &&
    (status === 'streaming' || status === 'submitted') &&
    lastMessage?.role !== 'assistant'

  useEffect(() => {
    if (!approvalInFlight) return

    if (status === 'ready' || status === 'error') {
      setApprovalInFlight(null)
    }
  }, [approvalInFlight, status])

  useEffect(() => {
    if (isNewSession) return
    if (messages.length === 0) return

    const behavior: ScrollBehavior =
      status === 'streaming' || status === 'submitted' ? 'auto' : 'smooth'
    const id = requestAnimationFrame(() => {
      scrollMessagesToEnd(behavior)
    })
    return () => cancelAnimationFrame(id)
  }, [isNewSession, messages, scrollMessagesToEnd, status])

  const showPreviewAside =
    layout === 'page' && mdUp && attachmentPreview !== null

  const sendWithContext = useCallback(
    (content: { text: string }) => {
      if (layout !== 'page' || pageAttachment == null) {
        sendMessage(content)
        return
      }
      const header = dashboardAttachmentUserPrefix(
        pageAttachment.kind === 'resume' ? 'resume' : 'coverLetter',
        pageAttachment.title,
        pageAttachment.id,
      )
      sendMessage({ text: header + content.text })
    },
    [layout, pageAttachment, sendMessage],
  )

  function handleSend() {
    if (hasPendingApproval) return
    const trimmed = input.trim()
    if (!trimmed) return
    sendWithContext({ text: trimmed })
    setInput('')
    setTimeout(() => scrollMessagesToEnd('smooth'), 50)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const composerShell = (children: ReactNode, rounded: 'lg' | 'xl') => {
    const roundedClass =
      rounded === 'xl'
        ? 'overflow-hidden rounded-xl border border-border/60 bg-muted/30'
        : 'overflow-hidden rounded-lg bg-muted/30'
    return <div className={cn('flex w-full items-end gap-0', roundedClass)}>{children}</div>
  }

  const textareaBase =
    'flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'

  // No session yet: composer only
  if (isNewSession) {
    const inner = (
      <>
        <AutosizeTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              const t = input.trim()
              if (t) sendWithContext({ text: t })
              setInput('')
            }
          }}
          placeholder={placeholders.initial}
          title={layout === 'page' ? PAGE_COMPOSER_TITLE : undefined}
          minHeight={layout === 'page' ? 56 : 56}
          maxHeight={layout === 'page' ? 120 : 160}
          className={cn(
            textareaBase,
            layout === 'page'
              ? 'min-h-14 resize-none rounded-lg px-3 py-2.5 text-sm'
              : 'rounded-bl-lg px-3 py-2 text-xs',
          )}
        />
        <Button
          type="button"
          size="icon-xs"
          className={cn(
            'm-1.5 size-7 shrink-0 rounded-lg',
            layout === 'page' && 'm-0 mb-0.5 mr-0.5 size-9 shrink-0 rounded-full',
          )}
          disabled={!input.trim()}
          onClick={() => {
            const t = input.trim()
            if (t) sendWithContext({ text: t })
            setInput('')
          }}
        >
          <ArrowUp className={layout === 'page' ? 'size-3.5' : 'size-3.5'} />
        </Button>
      </>
    )

    if (layout === 'page' && pageHero) {
      return (
        <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-6 sm:px-4">
          <div className="flex w-full max-w-xl flex-col items-center gap-5">
            <h1 className="px-2 text-center text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
              {pageHero.title}
            </h1>
            {pageHero.subtitle ? (
              <p className="px-2 text-center text-sm text-muted-foreground">{pageHero.subtitle}</p>
            ) : null}
            <PagePromptShell>
              <div className="flex items-end gap-1.5 p-2">{inner}</div>
              <AgentPageAttachControls
                attachment={pageAttachment}
                onAttachmentChange={setPageAttachment}
                disabled={isComposerDisabled}
              />
            </PagePromptShell>
          </div>
        </div>
      )
    }

    return (
      <div className="flex w-full min-w-[280px] flex-col">
        {composerShell(inner, 'lg')}
      </div>
    )
  }

  const messagesList = (
    <>
      {layout === 'page' && messages.length === 0 && (
        <div className="min-h-0 flex-1 shrink-0" aria-hidden />
      )}
      {messages.length > 0 && (
        <div
          ref={messagesScrollRef}
          className={cn(
            'flex min-h-0 flex-col overflow-x-hidden overflow-y-auto px-3 py-3',
            layout === 'page' ? 'flex-1 px-4 pt-4' : messagesScrollClassName,
          )}
        >
          <div className="flex flex-col gap-2">
            {messages.map((msg) => {
              const showAssistantLoadingFallback =
                msg.role === 'assistant' &&
                msg.id === lastMessage?.id &&
                (status === 'streaming' || status === 'submitted') &&
                latestAssistantMessageIsEmpty

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-3 py-2',
                      layout === 'page' ? 'text-sm' : 'text-xs',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    {msg.role === 'user' ? (
                      <UserMessageContent
                        text={(msg.parts as Array<{ type: string; text?: string }>)
                          .filter((p) => p.type === 'text' && p.text)
                          .map((p) => p.text)
                          .join('')}
                        onOpenAttachmentPreview={setAttachmentPreview}
                      />
                    ) : (
                      <MessageParts
                        parts={msg.parts}
                        isStreaming={
                          msg.id === lastMessage?.id && status === 'streaming'
                        }
                        onPendingChanges={onPendingChanges}
                        onChangesApplied={onChangesApplied}
                        onChangesRejected={onChangesRejected}
                        addToolApprovalResponse={addToolApprovalResponse}
                        approvalInFlight={approvalInFlight}
                        onApprovalDecision={(decision) =>
                          setApprovalInFlight(decision)
                        }
                        loadingFallbackText={
                          showAssistantLoadingFallback
                            ? getApprovalFollowUpLabel(approvalInFlight)
                            : null
                        }
                      />
                    )}
                  </div>
                </div>
              )
            })}
            {showLoadingBubble && (
              <div className="flex flex-row">
                <div
                  className={cn(
                    'max-w-[85%] rounded-xl bg-muted px-3 py-2 text-muted-foreground',
                    layout === 'page' ? 'text-sm' : 'text-xs',
                  )}
                >
                  {getApprovalFollowUpLabel(approvalInFlight)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {layout === 'page' ? (
        <div className={pageComposerStripClassName()}>
          <PagePromptShell className="pb-1 pt-0">
            <div className="flex items-end gap-1.5 p-2">
              <AutosizeTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                title={PAGE_COMPOSER_TITLE}
                placeholder={
                  hasPendingApproval
                    ? placeholders.approval
                    : isAwaitingApprovalFollowUp
                      ? placeholders.awaitingFollowUp
                      : placeholders.active
                }
                minHeight={48}
                maxHeight={160}
                className={cn(textareaBase, 'min-h-12 resize-none rounded-lg px-3 py-2 text-sm')}
                disabled={isComposerDisabled}
              />
              <Button
                type="button"
                size="icon-xs"
                className="m-0 mb-0.5 mr-0.5 size-9 shrink-0 rounded-full"
                disabled={!input.trim() || isComposerDisabled}
                onClick={handleSend}
              >
                <ArrowUp className="size-3.5" />
              </Button>
            </div>
            <AgentPageAttachControls
              attachment={pageAttachment}
              onAttachmentChange={setPageAttachment}
              disabled={isComposerDisabled}
            />
          </PagePromptShell>
        </div>
      ) : (
        <div
          className={cn(
            messages.length > 0 && 'border-t border-foreground/8',
          )}
        >
          <div
            className="flex items-end gap-0 overflow-hidden rounded-t-lg bg-muted/30"
          >
            <AutosizeTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasPendingApproval
                  ? placeholders.approval
                  : isAwaitingApprovalFollowUp
                    ? placeholders.awaitingFollowUp
                    : placeholders.active
              }
              minHeight={56}
              maxHeight={160}
              className={cn(textareaBase, 'rounded-tl-lg px-3 py-2 text-xs')}
              disabled={isComposerDisabled}
            />
            <Button
              type="button"
              size="icon-xs"
              className="m-1.5 size-7 shrink-0 rounded-lg"
              disabled={!input.trim() || isComposerDisabled}
              onClick={handleSend}
            >
              <ArrowUp className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  )

  const previewDoc = attachmentPreview
  const attachmentPreviewDialogEl =
    previewDoc != null && (layout !== 'page' || !mdUp) ? (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) setAttachmentPreview(null)
        }}
      >
        <DialogContent
          showCloseButton
          className="flex max-h-[min(92dvh,900px)] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        >
          <DialogHeader className="shrink-0 pr-10">
            <DialogTitle className="truncate text-left">
              {previewDoc.kind === 'resume' ? 'Resume' : 'Cover letter'}
              {' · '}
              {previewDoc.title}
            </DialogTitle>
          </DialogHeader>
          <AgentDashboardDocumentPreview
            attachment={previewDoc}
            density="dialog"
            className="min-h-0"
          />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/40 px-4 py-3">
            <AgentOpenInBuilderLink attachment={previewDoc} />
          </div>
        </DialogContent>
      </Dialog>
    ) : null

  if (layout === 'page') {
    return (
      <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
        {attachmentPreviewDialogEl}

        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-row overflow-hidden">
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-hidden',
              showPreviewAside ? 'min-w-[22rem]' : 'min-w-0',
            )}
          >
            {messagesList}
          </div>
          {showPreviewAside && previewDoc ? (
            <aside
              className={cn(
                'flex min-h-0 shrink-0 flex-col border-l border-border/40 bg-background/95 shadow-[inset_1px_0_0_rgba(0,0,0,0.04)] supports-backdrop-filter:backdrop-blur-md dark:bg-muted/30 dark:shadow-[inset_1px_0_0_rgba(255,255,255,0.06)]',
                agentDocumentPreviewAsideWidthClass,
              )}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 px-3 py-2.5">
                <p className="min-w-0 truncate text-xs font-semibold tracking-tight text-foreground">
                  {previewDoc.kind === 'resume' ? 'Resume' : 'Cover letter'}
                  <span className="font-normal text-muted-foreground"> · </span>
                  <span className="text-muted-foreground">{previewDoc.title}</span>
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <AgentOpenInBuilderLink attachment={previewDoc} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 shrink-0 rounded-full"
                    aria-label="Close preview"
                    onClick={() => setAttachmentPreview(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="min-h-0 min-w-0 flex-1 overflow-auto">
                <AgentDashboardDocumentPreview attachment={previewDoc} density="panel" />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <>
      {attachmentPreviewDialogEl}
      <div className="flex w-full min-w-[280px] flex-col">{messagesList}</div>
    </>
  )
}

function MessageParts({
  parts,
  isStreaming,
  onPendingChanges,
  onChangesApplied,
  onChangesRejected,
  addToolApprovalResponse,
  approvalInFlight,
  onApprovalDecision,
  loadingFallbackText,
}: {
  parts: Array<{ type: string; [key: string]: unknown }>
  isStreaming: boolean
  onPendingChanges: (c: DocumentChange[]) => void
  onChangesApplied: () => void
  onChangesRejected: () => void
  addToolApprovalResponse: (args: {
    id: string
    approved: boolean
    reason?: string
  }) => void
  approvalInFlight: { approved: boolean; id: string } | null
  onApprovalDecision: (decision: { approved: boolean; id: string }) => void
  loadingFallbackText: string | null
}) {
  const proposalPart = parts.find(
    (part) =>
      part.type === 'tool-proposeDocumentChanges' &&
      'state' in part &&
      part.state === 'approval-requested' &&
      'approval' in part &&
      'input' in part,
  ) as
    | ({
        state: 'approval-requested'
        approval: { id: string }
        input: {
          changes: DocumentChange[]
          summary?: string
        }
      } & { type: string })
    | undefined

  const proposalResolved = parts.some(
    (part) =>
      part.type === 'tool-proposeDocumentChanges' &&
      'state' in part &&
      (part.state === 'output-available' ||
        part.state === 'output-denied' ||
        part.state === 'approval-responded'),
  )

  useEffect(() => {
    if (proposalPart?.input?.changes) {
      onPendingChanges(proposalPart.input.changes)
      return
    }

    if (proposalResolved) {
      onPendingChanges([])
    }
  }, [onPendingChanges, proposalPart, proposalResolved])

  const renderedParts = parts.map((part, i) => {
    if (part.type === 'text' && 'text' in part && part.text) {
      return (
        <AgentMarkdown key={i} isStreaming={isStreaming}>
          {String(part.text)}
        </AgentMarkdown>
      )
    }

    if (part.type === 'tool-proposeDocumentChanges' && 'state' in part) {
      const toolPart = part as typeof part & {
        state: string
        approval?: { id: string }
        input?: {
          changes: DocumentChange[]
          summary?: string
        }
      }
      if (
        toolPart.state === 'approval-requested' &&
        toolPart.approval?.id &&
        toolPart.input?.changes
      ) {
        const approvalId = toolPart.approval.id
        const { changes, summary } = toolPart.input
        const isSubmittingDecision = approvalInFlight?.id === approvalId
        return (
          <div
            key={i}
            className="mt-2 space-y-2 rounded-lg border border-border bg-muted/50 p-2.5"
          >
            <p className="text-xs font-medium text-foreground">
              {summary ?? `${changes.length} change(s) proposed`}
            </p>
            {isSubmittingDecision && (
              <p className="text-xs text-muted-foreground">
                {approvalInFlight.approved
                  ? 'Applying your approved changes...'
                  : 'Sending your rejection to the AI...'}
              </p>
            )}
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                className="h-7 gap-1"
                disabled={isSubmittingDecision}
                onClick={() => {
                  onApprovalDecision({ id: approvalId, approved: true })
                  addToolApprovalResponse({ id: approvalId, approved: true })
                  onChangesApplied()
                }}
              >
                <Check className="size-3.5" />
                Apply
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1"
                disabled={isSubmittingDecision}
                onClick={() => {
                  onApprovalDecision({ id: approvalId, approved: false })
                  addToolApprovalResponse({
                    id: approvalId,
                    approved: false,
                    reason: 'Rejected by user',
                  })
                  onPendingChanges([])
                  onChangesRejected()
                }}
              >
                <X className="size-3.5" />
                Reject
              </Button>
            </div>
          </div>
        )
      }
    }

    if (part.type?.toString().startsWith('tool-') && 'state' in part) {
      const toolPart = part
      if (toolPart.state === 'input-streaming') {
        return (
          <span key={i} className="text-muted-foreground">
            Thinking…
          </span>
        )
      }
      if (toolPart.state === 'input-available') {
        return (
          <span key={i} className="text-muted-foreground">
            Running tool…
          </span>
        )
      }
    }

    return null
  })

  const hasRenderedParts = renderedParts.some(Boolean)

  if (!hasRenderedParts) {
    return loadingFallbackText ? (
      <span className="text-muted-foreground">{loadingFallbackText}</span>
    ) : null
  }

  return <div className="space-y-2">{renderedParts}</div>
}
