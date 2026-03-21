import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  FilePlus2,
  FileText,
  Linkedin,
  Paperclip,
  Plus,
  Upload,
  X,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { cn } from '#/lib/utils'

import { coverLetterKeys, listCoverLetters } from '#/features/cover-letter/lib/queries'
import { listResumes, resumeKeys } from '#/features/resume/lib/queries'

export type PageDocumentAttachment = {
  kind: 'resume' | 'coverLetter'
  id: string
  title: string
}

function parseDate(value: Date | string | undefined): Date | null {
  if (value == null) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function relative(d: Date | null) {
  if (!d) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
}

function DashboardDocumentsDialog({
  open,
  onOpenChange,
  onPick,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (doc: PageDocumentAttachment) => void
}>) {
  const resumesQuery = useQuery({
    queryKey: resumeKeys.all,
    queryFn: listResumes,
    enabled: open,
  })
  const lettersQuery = useQuery({
    queryKey: coverLetterKeys.all,
    queryFn: listCoverLetters,
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(560px,90dvh)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/40 px-4 py-3">
          <DialogTitle>Add from dashboard</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4">
          <Tabs defaultValue="resumes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumes">Resumes</TabsTrigger>
              <TabsTrigger value="cover-letters">Cover letters</TabsTrigger>
            </TabsList>
            <TabsContent value="resumes" className="mt-3 max-h-[min(360px,50dvh)] overflow-y-auto">
              {resumesQuery.isPending ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Loading resumes…</p>
              ) : resumesQuery.isError ? (
                <p className="py-8 text-center text-xs text-destructive">Could not load resumes.</p>
              ) : !resumesQuery.data?.length ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No resumes yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {resumesQuery.data.map((r) => {
                    const created = parseDate(r.createdAt as Date | string)
                    const edited = parseDate(r.updatedAt as Date | string)
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/40"
                          onClick={() => {
                            onPick({ kind: 'resume', id: r.id, title: r.title })
                            onOpenChange(false)
                          }}
                        >
                          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{r.title}</span>
                              {r.isDefault ? (
                                <span className="rounded-full bg-primary/15 px-2 py-px text-[10px] font-medium text-primary">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 flex gap-4 text-[11px] text-muted-foreground">
                              <span>Created {relative(created)}</span>
                              <span>Edited {relative(edited)}</span>
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="cover-letters" className="mt-3 max-h-[min(360px,50dvh)] overflow-y-auto">
              {lettersQuery.isPending ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Loading cover letters…</p>
              ) : lettersQuery.isError ? (
                <p className="py-8 text-center text-xs text-destructive">Could not load cover letters.</p>
              ) : !lettersQuery.data?.length ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No cover letters yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {lettersQuery.data.map((c) => {
                    const created = parseDate(c.createdAt as Date | string)
                    const edited = parseDate(c.updatedAt as Date | string)
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/40"
                          onClick={() => {
                            onPick({ kind: 'coverLetter', id: c.id, title: c.title })
                            onOpenChange(false)
                          }}
                        >
                          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{c.title}</span>
                              {c.isDefault ? (
                                <span className="rounded-full bg-primary/15 px-2 py-px text-[10px] font-medium text-primary">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 flex gap-4 text-[11px] text-muted-foreground">
                              <span>Created {relative(created)}</span>
                              <span>Edited {relative(edited)}</span>
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AgentPageAttachControls({
  attachment,
  onAttachmentChange,
  disabled,
  className,
}: Readonly<{
  attachment: PageDocumentAttachment | null
  onAttachmentChange: (next: PageDocumentAttachment | null) => void
  disabled?: boolean
  className?: string
}>) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)

  const attachLabel =
    attachment == null
      ? 'Attach a document'
      : attachment.kind === 'resume'
        ? `Resume: ${attachment.title}`
        : `Cover letter: ${attachment.title}`

  return (
    <div className={cn('flex flex-wrap items-center gap-2 border-t border-border/40 px-2 py-2', className)}>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-1.5 rounded-full border-border/60 px-3 text-[10px] font-semibold tracking-wide uppercase"
          >
            <Plus className="size-3.5 opacity-80" aria-hidden />
            {attachment ? 'Change attachment' : 'Attach a document'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem disabled className="gap-2 opacity-60">
            <Upload className="size-3.5" aria-hidden />
            Upload PDF or DOCX
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => {
              e.preventDefault()
              setMenuOpen(false)
              setDashboardOpen(true)
            }}
          >
            <FilePlus2 className="size-3.5" aria-hidden />
            Add from dashboard
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="gap-2 opacity-60">
            <Linkedin className="size-3.5" aria-hidden />
            Add from LinkedIn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {attachment ? (
        <div className="flex min-w-0 max-w-full items-center gap-1 rounded-full border border-border/50 bg-muted/30 py-1 pr-1 pl-2 text-[11px] text-muted-foreground">
          <Paperclip className="size-3 shrink-0 opacity-70" aria-hidden />
          <span className="truncate text-foreground">{attachLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-6 shrink-0 rounded-full"
            disabled={disabled}
            onClick={() => onAttachmentChange(null)}
            aria-label="Remove attachment"
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : null}

      <DashboardDocumentsDialog
        open={dashboardOpen}
        onOpenChange={setDashboardOpen}
        onPick={(doc) => {
          onAttachmentChange(doc)
          setDashboardOpen(false)
        }}
      />
    </div>
  )
}
