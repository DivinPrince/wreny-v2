import { FileText, Sparkles } from 'lucide-react'
import { RiLinkedinBoxFill } from '@remixicon/react'

import { cn } from '#/lib/utils'
import { useSession } from '#/lib/auth-client'

import { useCreateCoverLetter } from '../lib/queries'

const featureCards = [
  {
    id: 'ai-agent',
    title: 'AI Cover Letter Agent',
    description: 'Craft tailored cover letters with AI assistance',
    icon: Sparkles,
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
    <div className="grid gap-4 sm:grid-cols-3">
      {featureCards.map((card) => {
        const Icon = card.icon

        const content = (
          <div
            className={cn(
              'flex flex-col gap-3 rounded-lg border border-transparent bg-muted/50 p-4 transition-colors',
              'cursor-pointer hover:border-muted-foreground/20'
            )}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">{card.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {card.description}
              </p>
            </div>
          </div>
        )

        if (card.id === 'ai-agent') {
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => createMutation.mutate({ user: session?.user })}
              disabled={createMutation.isPending}
              className="text-left"
            >
              {content}
            </button>
          )
        }

        return <div key={card.id}>{content}</div>
      })}
    </div>
  )
}
