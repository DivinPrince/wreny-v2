import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog'
import {
  Activity,
  Bot,
  Brain,
  DraftingCompass,
  ListChecks,
  Mail,
  Maximize2,
  Shield,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'

interface Feature {
  icon: LucideIcon
  text: string
}

interface FeaturesProps {
  heading: string
  description: string
  features: Feature[]
  video: {
    src: string
  }
  orientation?: 'right' | 'left'
}

export function FeaturesSection({
  heading,
  description,
  features,
  video,
  orientation = 'right',
}: FeaturesProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <section className="py-4 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:gap-24">
          <div className={`w-full ${orientation === 'left' ? 'md:order-last' : ''}`}>
            <div className="max-w-xl md:pr-6 lg:pr-0">
              <h2 className="text-2xl font-semibold lg:text-3xl">{heading}</h2>
              <p className="mt-4 text-[0.95rem] text-muted-foreground">{description}</p>
            </div>
            <ul className="mt-6 divide-y border-y text-sm *:flex *:items-center *:gap-3 *:py-2.5">
              {features.map((feature, index) => (
                <li key={index}>
                  <feature.icon className="size-4" />
                  {feature.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-border/50 relative w-full overflow-hidden rounded-3xl border p-3">
            <div className="bg-linear-to-b relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
              <div
                className="relative w-full overflow-hidden rounded-[15px]"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <video className="w-full h-auto" autoPlay muted loop playsInline>
                  <source src={video.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {isHovering ? (
                  <button
                    type="button"
                    className="absolute right-4 top-4 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-all hover:bg-black/60"
                    onClick={() => setIsModalOpen(true)}
                    aria-label="View fullscreen"
                  >
                    <Maximize2 className="size-5 text-white" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-5xl border-none bg-transparent p-0 shadow-none"
        >
          <DialogTitle className="sr-only">Video</DialogTitle>
          <div className="relative">
            <button
              type="button"
              className="absolute top-2.5 right-2.5 z-10 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-all hover:bg-black/60"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
            >
              <X className="size-5 text-white" />
            </button>
            <video
              className="w-full h-auto rounded-lg"
              autoPlay
              controls
              playsInline
              src={video.src}
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

const FEATURE_SECTIONS = [
  {
    heading: 'Shape your resume to the job—not a generic one-pager',
    description:
      'Adjust emphasis, wording, and structure for each role so hiring managers see the experience that fits their posting, not a wall of everything you have ever done.',
    features: [
      { icon: Brain, text: 'Surface the wins that match what the listing asks for' },
      { icon: Activity, text: 'Spot gaps against the job description before you hit submit' },
      { icon: Shield, text: 'Layouts and guidance aimed at readable, ATS-friendly files' },
      { icon: DraftingCompass, text: 'Swap templates without redoing your content from scratch' },
    ],
    video: {
      src: '/resume-optimization.mp4',
    },
    orientation: 'right' as const,
  },
  {
    heading: 'A cover letter that sounds like you read the posting',
    description:
      'Draft a first version fast, then edit in place. Tie your story to the company and role instead of sending the same opening paragraph to everyone.',
    features: [
      { icon: Bot, text: 'Starting point grounded in the job description you paste or summarize' },
      { icon: Zap, text: 'Go from blank page to something you can send in one sitting' },
      { icon: Mail, text: 'Keep tone and structure aligned with your resume' },
      { icon: Activity, text: 'Tweak sentences in the editor until you are happy to sign your name' },
    ],
    video: {
      src: '/cover-letter.mp4',
    },
    orientation: 'left' as const,
  },
  {
    heading: 'One board for every application',
    description:
      'Move roles from applied to interview to offer without digging through email. Keep the posting and your notes next to each company so follow-ups take seconds, not a spreadsheet hunt.',
    features: [
      { icon: Activity, text: 'See status at a glance instead of replaying what you sent where' },
      { icon: ListChecks, text: 'Fewer open tabs: each company, link, and stage lives in one column' },
      { icon: Shield, text: 'Keep job descriptions and links attached to each application' },
      { icon: Brain, text: 'Log stages and feedback so you know what to prep for next' },
    ],
    video: {
      src: '/job-tracking.mp4',
    },
    orientation: 'right' as const,
  },
]

export default function Features() {
  return (
    <div className="space-y-4 mt-14" id="features">
      {FEATURE_SECTIONS.map((section, index) => (
        <FeaturesSection
          key={index}
          heading={section.heading}
          description={section.description}
          features={section.features}
          video={section.video}
          orientation={section.orientation}
        />
      ))}
    </div>
  )
}
