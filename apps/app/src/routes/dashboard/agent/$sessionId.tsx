import { isAgentSessionId } from '@repo/core/util'
import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Validates `sessionId` in the URL. UI and `useAgentChat` run in the parent `route.tsx`.
 */
export const Route = createFileRoute('/dashboard/agent/$sessionId')({
  beforeLoad: ({ params }) => {
    const id = params.sessionId?.trim() ?? ''
    if (!id || !isAgentSessionId(id)) {
      throw redirect({ to: '/dashboard/agent' })
    }
  },
  component: AgentSessionOutlet,
})

function AgentSessionOutlet() {
  return null
}
