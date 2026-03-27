import { useEffect, useRef, useState } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import type { ResumeInfo } from '@repo/core/resume'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

type LinkedInImportMutation = UseMutationResult<
  ResumeInfo,
  Error,
  string,
  unknown
>

export function LinkedInResumeImportDialog({
  open,
  onOpenChange,
  mutation,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  mutation: LinkedInImportMutation
}>) {
  const [url, setUrl] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  /** `useMutation()` returns a new result object when status changes; do not put `mutation` in effect deps. */
  const prevOpen = useRef(open)

  useEffect(() => {
    const wasOpen = prevOpen.current
    prevOpen.current = open

    if (open && !wasOpen) {
      setLocalError(null)
      mutation.reset()
    }
    if (!open && wasOpen) {
      setUrl('')
    }
    // Only `open` — the mutation result object from useMutation is not referentially stable.
  }, [open])

  const serverMessage =
    mutation.error instanceof Error ? mutation.error.message : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from LinkedIn</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="linkedin-profile-url">Profile URL</Label>
            <Input
              id="linkedin-profile-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://www.linkedin.com/in/your-profile"
              value={url}
              disabled={mutation.isPending}
              onChange={(e) => {
                setUrl(e.target.value)
                setLocalError(null)
              }}
            />
          </div>
          {(localError || serverMessage) ? (
            <p className="text-xs text-destructive" role="alert">
              {localError ?? serverMessage}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border/40 px-4 py-3 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              const trimmed = url.trim()
              if (!trimmed) {
                setLocalError('Enter your LinkedIn profile URL.')
                return
              }
              try {
                const u = new URL(trimmed)
                const host = u.hostname.replace(/^www\./i, '').toLowerCase()
                if (host !== 'linkedin.com') {
                  setLocalError('URL must be on linkedin.com.')
                  return
                }
                const p = u.pathname.toLowerCase()
                if (!p.includes('/in/') && !p.startsWith('/pub/')) {
                  setLocalError('Use a profile URL that contains /in/ or starts with /pub/.')
                  return
                }
              } catch {
                setLocalError('Enter a valid URL.')
                return
              }
              mutation.mutate(trimmed, {
                onSuccess: () => {
                  onOpenChange(false)
                },
              })
            }}
          >
            {mutation.isPending ? 'Importing…' : 'Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
