import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from 'ai'
import { ArrowUp, Check, X } from 'lucide-react'
import type { DocumentChange } from '@repo/core/agent'

import { AutosizeTextarea } from '#/components/ui/autosize-textarea'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const API_BASE = import.meta.env.VITE_API_URL || ''
const AGENT_API = API_BASE ? `${API_BASE}/api/agent` : '/api/agent'

type AgentPanelContentProps = {
  coverLetterId: string
  onPendingChanges: (changes: DocumentChange[]) => void
  onChangesApplied: () => void
  onChangesRejected: () => void
}

export function AgentPanelContent({
  coverLetterId,
  onPendingChanges,
  onChangesApplied,
  onChangesRejected,
}: AgentPanelContentProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const coverLetterIdRef = useRef(coverLetterId)
  coverLetterIdRef.current = coverLetterId

  const transport = useRef(
    new DefaultChatTransport({
      api: `${AGENT_API}/chat`,
      credentials: 'include',
      prepareSendMessagesRequest: ({
        body,
        id,
        messageId,
        messages,
        trigger,
      }) => ({
        body: {
          ...body,
          id,
          messages,
          trigger,
          messageId,
          documentType: 'coverLetter',
          coverLetterId: coverLetterIdRef.current,
        },
      }),
    }),
  ).current

  const { messages, sendMessage, status, addToolApprovalResponse } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })
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
  onPendingChanges,
  onChangesApplied,
  onChangesRejected,
  addToolApprovalResponse,
}: {
  parts: Array<{ type: string; [key: string]: unknown }>
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
            <span key={i} className="whitespace-pre-wrap wrap-break-word">
              {String(part.text)}
            </span>
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
              <div key={i} className="mt-2 space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-2 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  {summary ?? `${changes.length} change(s) proposed`}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 gap-1 bg-green-600 text-white hover:bg-green-700"
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
