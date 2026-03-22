import { useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useSession } from '#/lib/auth-client'

import { useCreateCoverLetter, useImportCoverLetterFromPdf } from './queries'

export function useCoverLetterCreateEntry() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const createMutation = useCreateCoverLetter()
  const importPdfMutation = useImportCoverLetterFromPdf()
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const busy = createMutation.isPending || importPdfMutation.isPending

  const openPdfPicker = () => {
    setTimeout(() => pdfInputRef.current?.click(), 0)
  }

  const goToLinkedInAgent = () => {
    navigate({ to: '/dashboard/agent' })
  }

  return {
    pdfInputRef,
    busy,
    createMutation,
    importPdfMutation,
    startManual: () => createMutation.mutate({ user: session?.user }),
    openPdfPicker,
    goToLinkedInAgent,
  }
}
