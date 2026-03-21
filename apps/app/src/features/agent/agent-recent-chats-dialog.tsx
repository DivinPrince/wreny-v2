import { useMemo, useState } from 'react'
import type { AgentSessionInfo } from '@repo/sdk'
import { useApi } from '@repo/sdk/react'
import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays, format } from 'date-fns'
import { FileText, History } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { cn } from '#/lib/utils'

import { GENERAL_DOCUMENT_ID, GENERAL_DOCUMENT_TYPE } from './agent-route-constants'

function sessionBucket(date: Date): string {
  const days = differenceInCalendarDays(new Date(), date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days <= 7) return 'This week'
  if (days <= 14) return 'Last week'
  return 'Earlier'
}

function groupSessions(sessions: AgentSessionInfo[]) {
  const order = ['Today', 'Yesterday', 'This week', 'Last week', 'Earlier'] as const
  const map = new Map<string, AgentSessionInfo[]>()
  for (const s of sessions) {
    const created = s.createdAt ? new Date(s.createdAt) : new Date(0)
    const label = Number.isNaN(created.getTime()) ? 'Earlier' : sessionBucket(created)
    const list = map.get(label) ?? []
    list.push(s)
    map.set(label, list)
  }
  return order.filter((k) => map.has(k)).map((k) => ({ label: k, items: map.get(k)! }))
}

export function AgentRecentChatsDialog({
  className,
}: Readonly<{ className?: string }>) {
  const api = useApi()
  const [open, setOpen] = useState(false)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['agent-sessions-list', GENERAL_DOCUMENT_TYPE, GENERAL_DOCUMENT_ID] as const,
    queryFn: async () => {
      const res = await api.agent.listSessions({
        documentType: GENERAL_DOCUMENT_TYPE,
        documentId: GENERAL_DOCUMENT_ID,
      })
      return res.data
    },
    enabled: open,
    staleTime: 30 * 1000,
  })

  const grouped = useMemo(() => (data?.length ? groupSessions(data) : []), [data])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-8 gap-1.5 text-[10px] font-semibold tracking-wide uppercase',
            className,
          )}
        >
          <History className="size-3.5 opacity-70" aria-hidden />
          Recent chats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(520px,85dvh)] overflow-hidden p-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recent chats</DialogTitle>
        </DialogHeader>
        <div className="max-h-[min(420px,70dvh)] overflow-y-auto px-1 pb-3">
          {isPending ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading…</p>
          ) : isError ? (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-destructive">Could not load chats.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-7 text-xs"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          ) : !data?.length ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">No chats yet.</p>
          ) : (
            <ul className="space-y-4 px-2 pt-1">
              {grouped.map(({ label, items }) => (
                <li key={label}>
                  <p className="mb-1.5 px-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((session) => {
                      const created = session.createdAt ? new Date(session.createdAt) : null
                      const dateLabel =
                        created && !Number.isNaN(created.getTime())
                          ? format(created, 'MMM d, yyyy')
                          : '—'
                      const title =
                        session.preview?.trim() || 'New chat'
                      const sessionId = session.id.trim()
                      return (
                        <li key={session.id}>
                          <Link
                            to="/dashboard/agent/$sessionId"
                            params={{ sessionId }}
                            onClick={() => setOpen(false)}
                            className="flex w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-snug text-foreground">
                                {title}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <FileText className="size-3 shrink-0 opacity-70" aria-hidden />
                                <span className="truncate">[Wreny] Agent</span>
                              </p>
                            </div>
                            <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground tabular-nums">
                              {dateLabel}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
