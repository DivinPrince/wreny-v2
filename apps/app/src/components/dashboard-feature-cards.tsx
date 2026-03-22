import type { ComponentType, SVGProps } from 'react'

import { cn } from '#/lib/utils'

export type DashboardFeatureCard = {
  id: string
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const AI_AGENT_CARD_ID = 'ai-agent'
const IMPORT_PDF_CARD_ID = 'import-pdf'

type DashboardFeatureCardsProps = {
  cards: DashboardFeatureCard[]
  listAriaLabel: string
  onAiAgentClick: () => void
  aiAgentDisabled?: boolean
  onImportPdfClick?: () => void
  importPdfDisabled?: boolean
}

export function DashboardFeatureCards({
  cards,
  listAriaLabel,
  onAiAgentClick,
  aiAgentDisabled,
  onImportPdfClick,
  importPdfDisabled,
}: DashboardFeatureCardsProps) {
  const itemClass = 'h-full min-h-0 w-full min-w-0 text-left'

  return (
    <div
      className={cn(
        'grid grid-cols-3',
        'max-sm:gap-0 max-sm:divide-x max-sm:divide-border max-sm:overflow-hidden max-sm:rounded-lg max-sm:border max-sm:border-border',
        'sm:gap-4 sm:divide-x-0 sm:overflow-visible sm:rounded-none sm:border-0'
      )}
      role="list"
      aria-label={listAriaLabel}
    >
      {cards.map((card) => {
        const Icon = card.icon
        const isWrenyLogo = card.id === AI_AGENT_CARD_ID
        const isImportPdf =
          card.id === IMPORT_PDF_CARD_ID && Boolean(onImportPdfClick)
        const isInteractive =
          card.id === AI_AGENT_CARD_ID || isImportPdf

        const content = (
          <div
            className={cn(
              'flex h-full min-h-0 flex-col gap-1.5 bg-muted/50 p-2.5 transition-colors',
              'max-sm:rounded-none max-sm:border-0',
              'sm:gap-3 sm:rounded-lg sm:border sm:border-transparent sm:p-4',
              isInteractive &&
                'cursor-pointer max-sm:hover:bg-muted/70 sm:hover:border-muted-foreground/20',
              !isInteractive && 'cursor-default'
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

        if (isInteractive) {
          const disabled =
            card.id === AI_AGENT_CARD_ID
              ? aiAgentDisabled
              : importPdfDisabled
          const onClick =
            card.id === AI_AGENT_CARD_ID
              ? onAiAgentClick
              : onImportPdfClick!

          return (
            <button
              key={card.id}
              type="button"
              onClick={onClick}
              disabled={disabled}
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
