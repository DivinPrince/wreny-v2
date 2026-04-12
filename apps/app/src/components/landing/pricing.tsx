import { Button } from '#/components/ui/button'
import { plans } from '#/lib/plans'
import { cn } from '#/lib/utils'
import { Check } from 'lucide-react'

interface PricingProps {
  showFree?: boolean
}

export default function Pricing({ showFree = true }: PricingProps) {
  const filteredPlans = plans.filter((plan) => showFree || plan.slug !== 'free')

  return (
    <section className="py-14" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold lg:text-3xl mb-3">Pay for how hard you are job searching</h2>
          <p className="text-[0.95rem] text-muted-foreground max-w-2xl mx-auto">
            Start free while you test the waters. Move up when you want more resumes, exports, and AI
            help across a heavier search.
          </p>
        </div>

        <div
          className={cn(
            'grid grid-cols-1 md:grid-cols-2 gap-7 w-full mx-auto',
            showFree && 'lg:grid-cols-3',
          )}
        >
          {filteredPlans.map((plan) => {
            const hasDiscount =
              plan.price < (plan.priceAnchor || 0) && (plan.priceAnchor || 0) > 0

            return (
              <div
                key={plan.slug}
                className={cn(
                  'flex flex-col p-6 border bg-background relative rounded-lg',
                  plan.isFeatured ? 'border-primary' : 'border-border',
                )}
              >
                {plan.isFeatured ? (
                  <div className="absolute top-6 right-6 rounded-full text-muted-foreground text-[9px] font-normal border px-2 py-1 font-mono">
                    Limited offer
                  </div>
                ) : null}
                <h2 className="text-xl text-left mb-2">{plan.name}</h2>
                <div className="mt-1 flex items-baseline">
                  <span
                    className={cn(
                      'text-2xl font-medium tracking-tight',
                      hasDiscount && 'line-through text-muted-foreground',
                    )}
                  >
                    ${plan.priceAnchor || plan.price}
                  </span>
                  {hasDiscount ? (
                    <span className="ml-1 text-2xl font-medium tracking-tight">${plan.price}</span>
                  ) : null}
                  {plan.recurring ? <span className="ml-1 text-xl font-medium">/mo</span> : null}
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

                <div className="mt-4 flex-1">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-left text-muted-foreground font-mono">
                    INCLUDING
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 border-t border-border pt-4">
                  <Button
                    className={cn(
                      'h-9 w-full',
                      plan.slug === 'pro' && 'hover:bg-primary hover:text-secondary',
                    )}
                    variant={plan.slug === 'pro' ? 'secondary' : 'default'}
                    asChild
                  >
                    <a href={`/signup?plan=${plan.slug}`}>
                      {plan.slug === 'free'
                        ? 'Start free'
                        : plan.slug === 'pro'
                          ? 'Upgrade to Pro'
                          : 'Get Lifetime access'}
                    </a>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
