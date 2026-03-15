import { FileText, Plus } from 'lucide-react'

import { useSession } from '#/lib/auth-client'

import { useCreateCoverLetter } from '../lib/queries'

export function CreateNewCoverLetterRow() {
  const { data: session } = useSession()
  const createMutation = useCreateCoverLetter()

  return (
    <button
      type="button"
      onClick={() => createMutation.mutate({ user: session?.user })}
      disabled={createMutation.isPending}
      className="grid w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-3 transition-colors hover:border-muted-foreground/40 hover:bg-muted/20 disabled:opacity-50 hit-area-y-2 sm:grid-cols-[auto_1fr_6rem_6rem_auto]"
    >
      <div
        className="flex shrink-0 items-center justify-center rounded border border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground"
        style={{ width: 56, height: 76 }}
      >
        <FileText className="size-4" />
      </div>
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Plus className="size-4" />
        <span className="text-sm font-medium">
          {createMutation.isPending ? 'Creating…' : 'Create new cover letter'}
        </span>
      </div>
      <span className="hidden sm:block" aria-hidden />
      <span className="hidden sm:block" aria-hidden />
      <span aria-hidden />
    </button>
  )
}
