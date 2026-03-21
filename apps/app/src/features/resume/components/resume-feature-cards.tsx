import { FileText } from 'lucide-react'
import { RiLinkedinBoxFill } from '@remixicon/react'

import {
  DashboardFeatureCards,
  type DashboardFeatureCard,
} from '#/components/dashboard-feature-cards'
import { Icons } from '#/components/ui/icons'
import { useSession } from '#/lib/auth-client'

import { useCreateResume } from '../lib/queries'

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
  const { data: session } = useSession()
  const createMutation = useCreateResume()

  return (
    <DashboardFeatureCards
      cards={featureCards}
      listAriaLabel="Resume shortcuts"
      onAiAgentClick={() => createMutation.mutate({ user: session?.user })}
      aiAgentDisabled={createMutation.isPending}
    />
  )
}
