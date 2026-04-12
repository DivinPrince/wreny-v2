import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden bg-primary rounded-[40px] py-20 px-8 md:px-16">
          <div className="landing-grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Job Search?
            </h2>
            <p className="text-lg md:text-xl mb-8 text-primary-foreground/80">
              Join thousands of job seekers who have already boosted their career with Wreny&apos;s
              powerful resume and cover letter tools.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 px-8 bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link to="/signup" className="inline-flex items-center">
                  Get Started For Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/70">No credit card required</p>
          </div>

          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
