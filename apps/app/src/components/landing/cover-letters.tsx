import { cn } from '#/lib/utils'
import { ExternalLink } from 'lucide-react'

interface AiCoverLetterFeature {
  id: string
  title: string
  description: string
}

const aiFeatures: AiCoverLetterFeature[] = [
  {
    id: 'ai-tailored',
    title: 'AI-Tailored Content',
    description:
      'Our AI-generated content is specifically tailored to each job description, highlighting your most relevant qualifications.',
  },
  {
    id: 'quick-creation',
    title: 'Quick Creation',
    description:
      'Create compelling, professional cover letters in under 5 minutes, saving you time during your job search.',
  },
  {
    id: 'design-consistency',
    title: 'Design Consistency',
    description:
      "Match your resume's design and content for a consistent, professional application package.",
  },
  {
    id: 'built-in-editor',
    title: 'Built-in Editor',
    description:
      'Use our comprehensive editor with formatting and customization options to perfect your cover letter.',
  },
]

export default function CoverLetters() {
  const visibleFeatures = aiFeatures.slice(0, 3)

  return (
    <section className="py-16 relative overflow-hidden" id="cover-letter">
      <div className="absolute inset-0 -z-10" />

      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold lg:text-4xl mb-3">Cover Letters</h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Create personalized, ATS-optimized cover letters in seconds with our advanced AI technology.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleFeatures.map((feature, idx) => (
            <div
              key={feature.id}
              className={cn(
                'flex flex-col p-6 rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md',
                idx === 1 &&
                  'md:transform md:scale-110 md:shadow-lg md:border-primary/20 md:p-7 md:-mt-2 md:-mb-2',
              )}
            >
              <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground flex-grow">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block relative">
            <div className="bg-black text-white py-2.5 px-5 rounded-full flex items-center justify-between gap-8 shadow-md">
              <a href="/signup" className="text-sm font-medium flex items-center hover:underline">
                Try AI Cover Letters <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Our AI assistant helps you create tailored cover letters for every application
          </p>
        </div>
      </div>
    </section>
  )
}
