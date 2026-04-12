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
    title: 'Grounded in the role',
    description:
      'Start from the posting you care about so the letter cites real responsibilities instead of vague enthusiasm.',
  },
  {
    id: 'quick-creation',
    title: 'Draft fast, refine calmly',
    description:
      'Get a workable first pass quickly, then edit at your own pace—no staring at a blank doc after work.',
  },
  {
    id: 'design-consistency',
    title: 'Matches your resume',
    description:
      'Keep layout and tone aligned with the resume you are sending so the packet feels intentional.',
  },
  {
    id: 'built-in-editor',
    title: 'Edit before you send',
    description:
      'Change wording, order, and emphasis in one place until it sounds like something you would sign.',
  },
]

export default function CoverLetters() {
  const visibleFeatures = aiFeatures.slice(0, 3)

  return (
    <section className="py-16 relative overflow-hidden" id="cover-letter">
      <div className="absolute inset-0 -z-10" />

      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold lg:text-3xl mb-3">Cover letters tied to the job, not a stock opener</h2>
          <p className="text-[0.95rem] text-muted-foreground max-w-2xl mx-auto">
            Turn a job description into a draft you can edit—so you explain why this company and this role,
            not why you need any job.
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
                Write a letter for my next role <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            One flow per application: adjust, save, and send when it feels right
          </p>
        </div>
      </div>
    </section>
  )
}
