import { FileText } from 'lucide-react'
import { RiLinkedinBoxFill } from '@remixicon/react'

import { Icons } from '#/components/ui/icons'
import { cn } from '#/lib/utils'
import { useSession } from '#/lib/auth-client'

import { useCreateResume } from '../lib/queries'

const featureCards = [
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

  const itemClass = 'h-full min-h-0 w-full min-w-0 text-left'

  return (
    <div
      className={cn(
        'grid grid-cols-3',
        'max-sm:gap-0 max-sm:divide-x max-sm:divide-border max-sm:overflow-hidden max-sm:rounded-lg max-sm:border max-sm:border-border',
        'sm:gap-4 sm:divide-x-0 sm:overflow-visible sm:rounded-none sm:border-0'
      )}
      role="list"
      aria-label="Resume shortcuts"
    >
      {featureCards.map((card) => {
        const Icon = card.icon
        const isWrenyLogo = card.id === 'ai-agent'

        const content = (
          <div
            className={cn(
              'flex h-full min-h-0 flex-col gap-1.5 bg-muted/50 p-2.5 transition-colors',
              'cursor-pointer max-sm:rounded-none max-sm:border-0 max-sm:hover:bg-muted/70',
              'sm:gap-3 sm:rounded-lg sm:border sm:border-transparent sm:p-4 sm:hover:border-muted-foreground/20'
            )}
          >
            {isWrenyLogo ? (
              <div className="size-8 shrink-0 overflow-hidden rounded-md sm:size-9">
                <Icon className="block h-full w-full" aria-hidden />
              </div>
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground sm:size-9 sm:rounded-lg">
                <Icon className="size-4 sm:size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground sm:line-clamp-none sm:text-base sm:leading-normal">
                {card.title}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:mt-0.5 sm:text-sm sm:leading-normal">
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
              className={cn(
                itemClass,
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              role="listitem"
            >
              {content}
            </button>
          )
        }

        return (
          <div key={card.id} className={itemClass} role="listitem">
            {content}
          </div>
        )
      })}
    </div>
  )
}
