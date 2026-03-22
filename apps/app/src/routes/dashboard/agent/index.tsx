import { createFileRoute } from '@tanstack/react-router'

/**
 * Landing chat lives in the parent `route.tsx`. This index exists only for the `/dashboard/agent`
 * URL (no auto-redirect to a session id).
 */
export const Route = createFileRoute('/dashboard/agent/')({
  component: AgentIndexOutlet,
})

function AgentIndexOutlet() {
  return null
}
