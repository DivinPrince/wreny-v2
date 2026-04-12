import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'

export default function Hero() {
  const [thumbFailed, setThumbFailed] = useState(false)

  return (
    <section className="pt-8 md:pt-12 pb-0">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-[660px] space-y-5">
          <h1 className="text-[1.75rem] md:text-[2.5rem] md:leading-[1.15] font-bold tracking-tight">
            More <em className="font-bold italic">interviews</em> from the
            applications you already{' '}
            <em className="font-bold italic">send.</em>
          </h1>
          <p className="text-[0.95rem] md:text-lg text-muted-foreground max-w-[500px]">
            Tailor your resume and cover letter to each posting, track where you
            applied, and export a clean PDF—without fighting the formatting.
          </p>
          <div className="pt-1">
            <Button asChild className="h-10 px-5 rounded-lg text-sm gap-2">
              <Link to="/signup">
                Create my free resume
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 md:mt-10 relative">
          <div className="rounded-t-2xl overflow-hidden border border-border/60 border-b-0 shadow-2xl shadow-black/5 bg-muted max-h-[280px] md:max-h-[420px]">
            {!thumbFailed ? (
              <img
                src="/thumbnail.png"
                alt="Wreny resume editor showing a structured resume preview"
                className="w-full h-auto block"
                width={1200}
                height={675}
                loading="lazy"
                onError={() => setThumbFailed(true)}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
