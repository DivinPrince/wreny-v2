import { Plus } from 'lucide-react'
import type { DocumentChange } from '@repo/core/agent'
import { useAgentChat } from '@repo/sdk/react'

import { AgentPanelChat } from '#/features/agent/agent-chat-panel'
import { Button } from '#/components/ui/button'

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

const coverLetterPlaceholders = {
  initial: 'Ask AI to improve your cover letter…',
  active: 'Ask AI to improve your cover letter…',
  approval: 'Approve or reject the proposed changes to continue…',
  awaitingFollowUp: 'Waiting for AI to continue after your decision…',
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
          layout="popover"
          messagesScrollClassName="max-h-[240px]"
          isNewSession={isNewSession}
          messages={messages}
          sendMessage={sendMessage}
          status={status}
          addToolApprovalResponse={addToolApprovalResponse}
          onPendingChanges={onPendingChanges}
          onChangesApplied={onChangesApplied}
          onChangesRejected={onChangesRejected}
          placeholders={coverLetterPlaceholders}
        />
      )}
    </div>
  )
}
