import { Plus } from 'lucide-react'

import { useSession } from '#/lib/auth-client'

import { useCreateResume } from '../lib/queries'

export function CreateNewResumeCard() {
  const { data: session } = useSession()
  const createMutation = useCreateResume()

  return (
    <button
      type="button"
      onClick={() => createMutation.mutate({ user: session?.user })}
      disabled={createMutation.isPending}
      className="flex h-[320px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 transition-colors hover:border-muted-foreground/40 hover:bg-muted/30 disabled:opacity-50 hit-area-4 sm:w-[230px]"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Plus className="size-5 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        {createMutation.isPending ? 'Creating…' : 'Create new resume'}
      </span>
    </button>
  )
}
