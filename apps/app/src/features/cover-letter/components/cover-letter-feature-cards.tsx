import { FileText } from 'lucide-react'
import { RiLinkedinBoxFill } from '@remixicon/react'

import {
  DashboardFeatureCards,
  type DashboardFeatureCard,
} from '#/components/dashboard-feature-cards'
import { Icons } from '#/components/ui/icons'
import { useSession } from '#/lib/auth-client'

import { useCreateCoverLetter } from '../lib/queries'

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
  },
  {
    id: 'import-linkedin',
    title: 'Import from LinkedIn',
    description: 'Pull context from your profile',
    icon: RiLinkedinBoxFill,
  },
]

export function CoverLetterFeatureCards() {
  const { data: session } = useSession()
  const createMutation = useCreateCoverLetter()

  return (
    <DashboardFeatureCards
      cards={featureCards}
      listAriaLabel="Cover letter shortcuts"
      onAiAgentClick={() => createMutation.mutate({ user: session?.user })}
      aiAgentDisabled={createMutation.isPending}
    />
  )
}
