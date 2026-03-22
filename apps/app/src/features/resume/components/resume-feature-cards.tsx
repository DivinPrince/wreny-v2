import { useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { RiLinkedinBoxFill } from '@remixicon/react'

import {
  DashboardFeatureCards,
  type DashboardFeatureCard,
} from '#/components/dashboard-feature-cards'
import { DocumentScanningOverlay } from '#/components/document-scanning-overlay'
import { Icons } from '#/components/ui/icons'

import { useImportResumeFromPdf } from '../lib/queries'

const featureCards: DashboardFeatureCard[] = [
  {
    id: 'ai-agent',
    title: 'AI Resume Agent',
    description: 'Build and refine your resume with AI assistance',
    icon: Icons.Logo,
  },
  {
    id: 'import-pdf',
    title: 'Import from PDF',
    description: 'Convert your existing PDF resume',
    icon: FileText,
  },
  {
    id: 'import-linkedin',
    title: 'Import from LinkedIn',
    description: 'Pull your experience from LinkedIn',
    icon: RiLinkedinBoxFill,
  },
]

export function ResumeFeatureCards() {
  const navigate = useNavigate()
  const importPdfMutation = useImportResumeFromPdf()
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
        listAriaLabel="Resume shortcuts"
        onAiAgentClick={() => navigate({ to: '/dashboard/agent' })}
        aiAgentDisabled={importPdfMutation.isPending}
        onImportPdfClick={() => pdfInputRef.current?.click()}
        importPdfDisabled={importPdfMutation.isPending}
      />
    </>
  )
}
