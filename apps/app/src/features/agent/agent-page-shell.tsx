import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'

import { AgentRecentChatsDialog } from './agent-recent-chats-dialog'

export function AgentPageShell({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background px-4 py-2.5 supports-backdrop-filter:backdrop-blur-sm">
        <AgentRecentChatsDialog />
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-8 shrink-0 text-[10px] font-semibold tracking-wide uppercase"
          onClick={() => {
            void navigate({ to: '/dashboard/agent' })
          }}
        >
          New chat
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-6 pb-0">
        {children}
      </div>
    </div>
  )
}
