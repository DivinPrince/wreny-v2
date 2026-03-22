import { RiLinkedinBoxFill } from '@remixicon/react'
import { ChevronDown, FileText, PenLine, Plus } from 'lucide-react'

import { DocumentScanningOverlay } from '#/components/document-scanning-overlay'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'

import { useCoverLetterCreateEntry } from '../lib/use-cover-letter-create-entry'

export function CreateNewCoverLetterRow() {
  const {
    pdfInputRef,
    busy,
    createMutation,
    importPdfMutation,
    startManual,
    openPdfPicker,
    goToLinkedInAgent,
  } = useCoverLetterCreateEntry()

  const label = importPdfMutation.isPending
    ? 'Importing…'
    : createMutation.isPending
      ? 'Creating…'
      : 'Create new cover letter'

  return (
    <>
      <DocumentScanningOverlay open={importPdfMutation.isPending} />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) importPdfMutation.mutate(file)
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={busy}>
          <button
            type="button"
            className={cn(
              'grid w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-3 transition-colors hover:border-muted-foreground/40 hover:bg-muted/20 disabled:opacity-50 hit-area-y-2 sm:grid-cols-[auto_1fr_6rem_6rem_auto]',
              'data-[state=open]:border-muted-foreground/45 data-[state=open]:bg-muted/25'
            )}
          >
            <div
              className="flex shrink-0 items-center justify-center rounded border border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground"
              style={{ width: 56, height: 76 }}
            >
              <FileText className="size-4" />
            </div>
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Plus className="size-4 shrink-0" />
              <span className="text-sm font-medium">{label}</span>
              <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
            </div>
            <span className="hidden sm:block" aria-hidden />
            <span className="hidden sm:block" aria-hidden />
            <span aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[210] w-56">
          <DropdownMenuItem className="gap-2" onSelect={() => startManual()}>
            <PenLine className="size-3.5" aria-hidden />
            Manual — blank letter
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onSelect={() => openPdfPicker()}>
            <FileText className="size-3.5" aria-hidden />
            Import from PDF
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onSelect={() => goToLinkedInAgent()}>
            <RiLinkedinBoxFill className="size-3.5" aria-hidden />
            Import from LinkedIn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
