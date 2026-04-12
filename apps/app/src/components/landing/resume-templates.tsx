import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

const featuredTemplates = [
  { id: 'onyx', name: 'Onyx', isRecommended: true },
  { id: 'azurill', name: 'Azurill', isRecommended: true },
  { id: 'chikorita', name: 'Chikorita', isRecommended: true },
  { id: 'ditto', name: 'Ditto', isRecommended: true },
  { id: 'kakuna', name: 'Kakuna', isRecommended: true },
  { id: 'pikachu', name: 'Pikachu', isRecommended: true },
]

interface BadgeProps {
  className?: string
  variant?: 'default' | 'secondary' | 'outline'
  children: ReactNode
}

export default function ResumeTemplates() {
  const [activeIndex, setActiveIndex] = useState(0)

  const visibleTemplates = [
    featuredTemplates[activeIndex % featuredTemplates.length],
    featuredTemplates[(activeIndex + 1) % featuredTemplates.length],
    featuredTemplates[(activeIndex + 2) % featuredTemplates.length],
  ]

  const handlePrevious = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? featuredTemplates.length - 1 : prevIndex - 1,
    )
  }

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % featuredTemplates.length)
  }

  const getTemplateImageUrl = (templateId: string) => `/templates/jpg/${templateId}.jpg`

  return (
    <section className="py-16 relative overflow-hidden" id="resume">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-transparent -z-10" />

      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold lg:text-4xl mb-3">ATS-Friendly Resume Templates</h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Choose from our collection of professionally designed templates that are optimized to pass
            Applicant Tracking Systems and impress recruiters.
          </p>
        </div>

        <div className="mt-10 relative h-[600px] md:h-[700px] perspective">
          <div className="relative h-full w-full transform-style-3d">
            {visibleTemplates.map((template, idx) => (
              <div
                key={`${template.id}-${idx}`}
                className={cn(
                  'absolute rounded-lg shadow-lg transition-all duration-500 bg-card hover:z-50 cursor-pointer',
                  idx === 0 &&
                    'left-0 z-30 w-[42%] top-10 rotate-[-7deg] transform-gpu hover:rotate-[-5deg] hover:scale-105',
                  idx === 1 && 'left-1/2 -translate-x-1/2 z-40 w-[48%] bottom-0 hover:scale-105',
                  idx === 2 &&
                    'right-0 z-30 w-[42%] top-10 rotate-[7deg] transform-gpu hover:rotate-[5deg] hover:scale-105',
                )}
              >
                <div className="relative aspect-[210/297] overflow-hidden rounded-lg border border-border/40 shadow-lg">
                  <img
                    src={getTemplateImageUrl(template.id)}
                    alt={template.name}
                    className="object-cover size-full"
                    width={400}
                    height={566}
                    loading="lazy"
                  />

                  {idx === 1 ? (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-primary/90 text-white">
                        Featured
                      </Badge>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block relative">
            <div className="bg-black text-white py-2.5 px-5 rounded-full flex items-center justify-between gap-8 shadow-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="h-7 w-7 rounded-full text-white hover:bg-white/20"
                type="button"
                aria-label="Previous templates"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <a href="/signup" className="text-sm font-medium flex items-center hover:underline">
                View All Templates <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-7 w-7 rounded-full text-white hover:bg-white/20"
                type="button"
                aria-label="Next templates"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            12+ professional templates available, with new designs added regularly
          </p>
        </div>
      </div>
    </section>
  )
}

function Badge({ className, variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        variant === 'outline' && 'border border-border',
        className,
      )}
    >
      {children}
    </span>
  )
}
