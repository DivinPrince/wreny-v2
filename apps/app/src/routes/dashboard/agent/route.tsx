import { useCallback } from 'react'
import { isAgentSessionId } from '@repo/core/util'
import { useAgentChat } from '@repo/sdk/react'
import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router'

import { AgentPageShell } from '#/features/agent/agent-page-shell'
import { AgentPanelChat } from '#/features/agent/agent-chat-panel'
import {
  agentPageHero,
  agentPagePlaceholders,
  GENERAL_DOCUMENT_ID,
  GENERAL_DOCUMENT_TYPE,
} from '#/features/agent/agent-route-constants'

/**
 * Single layout for `/dashboard/agent` and `/dashboard/agent/:sessionId` so chat state survives
 * navigation after the first message (OpenCode-style: stay on `/agent` until you send, then move to
 * the session URL).
 */
export const Route = createFileRoute('/dashboard/agent')({
  component: DashboardAgentLayout,
})

function DashboardAgentLayout() {
  const navigate = useNavigate()
  const { sessionId: rawSessionId } = useParams({ strict: false }) as {
    sessionId?: string
  }
  const sessionId =
    rawSessionId && isAgentSessionId(rawSessionId) ? rawSessionId : undefined

  const {
    error: sessionError,
    isLoadingSession,
    isNewSession,
    messages,
    sendMessage,
    status,
    addToolApprovalResponse,
  } = useAgentChat({
    documentType: GENERAL_DOCUMENT_TYPE,
    documentId: GENERAL_DOCUMENT_ID,
    sessionId: sessionId ?? null,
    startNewSession: false,
    onSessionIdChange: (id) => {
      void navigate({
        to: '/dashboard/agent/$sessionId',
        params: { sessionId: id },
        replace: true,
      })
    },
  })

  const noop = useCallback(() => {}, [])

  const showSessionSkeleton = Boolean(sessionId && isLoadingSession)

  return (
    <AgentPageShell>
      {sessionError ? (
        <div className="flex flex-1 items-center justify-center text-sm text-destructive">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            {sessionError}
          </div>
        </div>
      ) : showSessionSkeleton ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto mt-8 w-full max-w-xl shrink-0">
            <div className="h-28 animate-pulse rounded-xl border border-border/40 bg-muted/30" aria-hidden />
            <p className="mt-3 text-center text-xs text-muted-foreground">Loading conversation…</p>
          </div>
        </div>
      ) : (
        <>
          <AgentPanelChat
            layout="page"
            isNewSession={isNewSession}
            messages={messages}
            sendMessage={sendMessage}
            status={status}
            addToolApprovalResponse={addToolApprovalResponse}
            onPendingChanges={noop}
            onChangesApplied={noop}
            onChangesRejected={noop}
            placeholders={agentPagePlaceholders}
            pageHero={sessionId ? undefined : agentPageHero}
          />
          <Outlet />
        </>
      )}
    </AgentPageShell>
  )
}
