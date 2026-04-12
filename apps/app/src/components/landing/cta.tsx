import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden bg-primary rounded-2xl py-12 px-8 md:px-14">
          <div className="landing-grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

          <div className="relative z-10 max-w-[660px] space-y-5">
            <h2 className="text-[1.75rem] md:text-[2.5rem] md:leading-[1.15] font-bold tracking-tight text-white">
              Send the next application with a{' '}
              <em className="font-bold italic">resume</em> you trust.
            </h2>
            <p className="text-[0.95rem] md:text-lg text-primary-foreground/70 max-w-[500px]">
              Build, tailor, and track in one workflow. When you are ready to
              apply, your file is clear, consistent, and aimed at that specific
              posting.
            </p>
            <div className="pt-1 flex items-center gap-4">
              <Button
                asChild
                variant="secondary"
                className="h-10 px-5 rounded-lg text-sm gap-2"
              >
                <Link to="/signup">
                  Start building free
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <span className="text-sm text-primary-foreground/50">
                Free tier available · No card to try
              </span>
            </div>
          </div>

          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
