import { Plus } from 'lucide-react'

import { useCreateResume } from '../lib/queries'

export function CreateNewResumeCard() {
  const createMutation = useCreateResume()

  return (
    <button
      type="button"
      onClick={() => createMutation.mutate()}
      disabled={createMutation.isPending}
      className="flex h-[320px] w-[230px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 transition-colors hover:border-muted-foreground/40 hover:bg-muted/30 disabled:opacity-50"
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
