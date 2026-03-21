import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, Plus, X } from 'lucide-react'
import type { DocumentAgentUIMessage, DocumentChange } from '@repo/core/agent'
import { useAgentChat } from '@repo/sdk/react'

import { AgentMarkdown } from '#/components/ui/agent-markdown'
import { AutosizeTextarea } from '#/components/ui/autosize-textarea'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type AgentPanelContentProps = {
  coverLetterId: string
  sessionId: string | null
  startNewSession: boolean
  onSessionIdChange: (sessionId: string) => void
  onNewChat: () => void
  onPendingChanges: (changes: DocumentChange[]) => void
  onChangesApplied: () => void
  onChangesRejected: () => void
}

export function AgentPanelContent({
  coverLetterId,
  sessionId,
  startNewSession,
  onSessionIdChange,
  onNewChat,
  onPendingChanges,
  onChangesApplied,
  onChangesRejected,
}: AgentPanelContentProps) {
  const {
    error: sessionError,
    isLoadingSession,
    isNewSession,
    messages,
    sendMessage,
    status,
    addToolApprovalResponse,
  } = useAgentChat({
    documentType: 'coverLetter',
    documentId: coverLetterId,
    sessionId,
    startNewSession,
    onSessionIdChange,
  })

  return (
    <div className="flex min-w-[280px] flex-col">
      <div className="flex justify-end px-2.5 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-7 rounded-lg"
          onClick={onNewChat}
          aria-label="Start a new chat"
          title="New chat"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {sessionError ? (
        <div className="flex min-h-28 items-center justify-center px-4 py-4 text-sm text-destructive">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            {sessionError}
          </div>
        </div>
      ) : isLoadingSession ? (
        <div className="flex min-h-28 items-center justify-center px-4 py-4 text-sm text-muted-foreground">
          Loading chat...
        </div>
      ) : (
        <AgentPanelChat
          isNewSession={isNewSession}
          messages={messages}
          sendMessage={sendMessage}
          status={status}
          addToolApprovalResponse={addToolApprovalResponse}
          onPendingChanges={onPendingChanges}
          onChangesApplied={onChangesApplied}
          onChangesRejected={onChangesRejected}
        />
      )}
    </div>
  )
}

function AgentPanelChat({
  isNewSession,
  messages,
  sendMessage,
  status,
  addToolApprovalResponse,
  onPendingChanges,
  onChangesApplied,
  onChangesRejected,
}: {
  isNewSession: boolean
  messages: DocumentAgentUIMessage[]
  sendMessage: (content: { text: string }) => void
  status: string
  addToolApprovalResponse: (args: { id: string; approved: boolean; reason?: string }) => void
  onPendingChanges: (changes: DocumentChange[]) => void
  onChangesApplied: () => void
  onChangesRejected: () => void
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNewSession || messages.length === 0) return

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isNewSession, messages, status])

  // No session yet: show composer only, sendMessage auto-creates session on first use
  if (isNewSession) {
    return (
      <div className="flex w-full min-w-[280px] flex-col">
        <div className="flex items-end gap-0 overflow-hidden rounded-lg bg-muted/30">
          <AutosizeTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const t = input.trim()
                if (t) sendMessage({ text: t })
                setInput('')
              }
            }}
            placeholder="Ask AI to improve your cover letter…"
            minHeight={56}
            maxHeight={160}
            className="flex-1 rounded-bl-lg border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="button"
            size="icon-xs"
            className="m-1.5 size-7 shrink-0 rounded-lg"
            disabled={!input.trim()}
            onClick={() => {
              const t = input.trim()
              if (t) sendMessage({ text: t })
              setInput('')
            }}
          >
            <ArrowUp className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

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
  const isComposerDisabled =
    hasPendingApproval || status === 'streaming' || status === 'submitted'
  const showLoadingBubble =
    !hasPendingApproval &&
    (status === 'streaming' || status === 'submitted') &&
    lastMessage?.role !== 'assistant'

  function handleSend() {
    if (hasPendingApproval) return
    const trimmed = input.trim()
    if (!trimmed) return
    sendMessage({ text: trimmed })
    setInput('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex w-full min-w-[280px] flex-col">
      {messages.length > 0 && (
        <div className="flex max-h-[240px] flex-col overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-xs',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {msg.role === 'user' ? (
                    <span className="whitespace-pre-wrap wrap-break-word">
                      {(msg.parts as Array<{ type: string; text?: string }>)
                        .filter((p) => p.type === 'text' && p.text)
                        .map((p) => p.text)
                        .join('')}
                    </span>
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
                    />
                  )}
                </div>
              </div>
            ))}
            {showLoadingBubble && (
              <div className="flex flex-row">
                <div className="max-w-[85%] rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Thinking...
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className={cn(messages.length > 0 && 'border-t border-foreground/8')}>
        <div className="flex items-end gap-0 overflow-hidden rounded-t-lg bg-muted/30">
          <AutosizeTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasPendingApproval
                ? 'Approve or reject the proposed changes to continue...'
                : 'Ask AI to improve your cover letter...'
            }
            minHeight={56}
            maxHeight={160}
            className="flex-1 rounded-tl-lg border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
    </div>
  )
}

function MessageParts({
  parts,
  isStreaming,
  onPendingChanges,
  onChangesApplied,
  onChangesRejected,
  addToolApprovalResponse,
}: {
  parts: Array<{ type: string; [key: string]: unknown }>
  isStreaming: boolean
  onPendingChanges: (c: DocumentChange[]) => void
  onChangesApplied: () => void
  onChangesRejected: () => void
  addToolApprovalResponse: (args: { id: string; approved: boolean; reason?: string }) => void
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
      (
        part.state === 'output-available' ||
        part.state === 'output-denied' ||
        part.state === 'approval-responded'
      ),
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

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.type === 'text' && 'text' in part && part.text) {
          return (
            <AgentMarkdown key={i} isStreaming={isStreaming}>
              {String(part.text)}
            </AgentMarkdown>
          )
        }

        if (
          part.type === 'tool-proposeDocumentChanges' &&
          'state' in part
        ) {
          const toolPart = part as typeof part & {
            state: string
            approval?: { id: string }
            input?: {
              changes: DocumentChange[]
              summary?: string
            }
          }
          if (toolPart.state === 'approval-requested' && toolPart.approval?.id && toolPart.input?.changes) {
            const approvalId = toolPart.approval.id
            const { changes, summary } = toolPart.input
            return (
              <div key={i} className="mt-2 space-y-2 rounded-lg border border-border bg-muted/50 p-2.5">
                <p className="text-xs font-medium text-foreground">
                  {summary ?? `${changes.length} change(s) proposed`}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => {
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
                    onClick={() => {
                      addToolApprovalResponse({ id: approvalId, approved: false, reason: 'Rejected by user' })
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
            return <span key={i} className="text-muted-foreground">Thinking...</span>
          }
          if (toolPart.state === 'input-available') {
            return <span key={i} className="text-muted-foreground">Running tool...</span>
          }
        }

        return null
      })}
    </div>
  )
}
