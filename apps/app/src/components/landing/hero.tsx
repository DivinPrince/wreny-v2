import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export default function Hero() {
  const [thumbFailed, setThumbFailed] = useState(false)

  return (
    <div className="relative hero-container bg-secondary rounded-[40px] py-8 mt-4">
      <div className="mx-auto text-center max-w-[1200px] mb-8 space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Build Resumes That Get You Hired
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          AI-powered resume builder that creates professional, ATS-optimized resumes in minutes.
          Perfect formatting, compelling content, zero hassle.
        </p>
        <div className="flex flex-col gap-4 items-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="h-12">
              <Link to="/signup">Get Started — It&apos;s free</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-center relative isolate md:container md:mx-auto">
        <div className="h-[220px] md:h-[420px] w-full md:w-[80%] rounded-t-[40px] overflow-hidden relative bg-muted">
          {!thumbFailed ? (
            <img
              src="/thumbnail.png"
              alt="Professional resume builder with AI-powered features"
              className="w-full h-full object-cover object-top rounded-t-[40px]"
              width={1200}
              height={675}
              loading="lazy"
              onError={() => setThumbFailed(true)}
            />
          ) : null}
        </div>
        <div className="z-[-1] bg-gradient-to-b from-primary/20 to-primary/10 rounded-t-[40px] w-[90%] absolute left-1/2 -translate-x-1/2 bottom-0 h-[74%] max-md:hidden" />
      </div>
    </div>
  )
}
