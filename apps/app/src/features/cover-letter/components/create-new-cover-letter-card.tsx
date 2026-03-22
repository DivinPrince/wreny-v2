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

export function CreateNewCoverLetterCard() {
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
              'flex h-[340px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 transition-colors hover:border-muted-foreground/40 hover:bg-muted/30 disabled:opacity-50 hit-area-4 sm:w-[230px]',
              'data-[state=open]:border-muted-foreground/45 data-[state=open]:bg-muted/35'
            )}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Plus className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <span>Choose how to start</span>
              <ChevronDown className="size-3 opacity-70" aria-hidden />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="z-[210] w-56">
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
