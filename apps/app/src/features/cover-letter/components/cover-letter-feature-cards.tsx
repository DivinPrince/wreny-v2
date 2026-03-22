import { useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FileText } from 'lucide-react'

import {
  DashboardFeatureCards,
  type DashboardFeatureCard,
} from '#/components/dashboard-feature-cards'
import { DocumentScanningOverlay } from '#/components/document-scanning-overlay'
import { Icons } from '#/components/ui/icons'

import { useImportCoverLetterFromPdf } from '../lib/queries'

const featureCards: DashboardFeatureCard[] = [
  {
    id: 'ai-agent',
    title: 'AI Cover Letter Agent',
    description: 'Craft tailored cover letters with AI assistance',
    icon: Icons.Logo,
  },
  {
    id: 'import-pdf',
    title: 'Import from PDF',
    description: 'Convert your existing cover letter',
    icon: FileText,
  }
]

export function CoverLetterFeatureCards() {
  const navigate = useNavigate()
  const importPdfMutation = useImportCoverLetterFromPdf()
  const pdfInputRef = useRef<HTMLInputElement>(null)

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
      <DashboardFeatureCards
        cards={featureCards}
        listAriaLabel="Cover letter shortcuts"
        onAiAgentClick={() => navigate({ to: '/dashboard/agent' })}
        aiAgentDisabled={importPdfMutation.isPending}
        onImportPdfClick={() => pdfInputRef.current?.click()}
        importPdfDisabled={importPdfMutation.isPending}
      />
    </>
  )
}
