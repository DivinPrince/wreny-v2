import { useRef, useState } from 'react'

import { useSession } from '#/lib/auth-client'

import {
  useCreateResume,
  useImportResumeFromLinkedIn,
  useImportResumeFromPdf,
} from './queries'

export function useResumeCreateEntry() {
  const { data: session } = useSession()
  const createMutation = useCreateResume()
  const importPdfMutation = useImportResumeFromPdf()
  const importLinkedInMutation = useImportResumeFromLinkedIn()
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [linkedinImportOpen, setLinkedinImportOpen] = useState(false)

  const busy =
    createMutation.isPending ||
    importPdfMutation.isPending ||
    importLinkedInMutation.isPending

  const openPdfPicker = () => {
    setTimeout(() => pdfInputRef.current?.click(), 0)
  }

  const openLinkedInImport = () => {
    setLinkedinImportOpen(true)
  }

  return {
    pdfInputRef,
    busy,
    createMutation,
    importPdfMutation,
    importLinkedInMutation,
    linkedinImportOpen,
    setLinkedinImportOpen,
    startManual: () => createMutation.mutate({ user: session?.user }),
    openPdfPicker,
    openLinkedInImport,
  }
}
