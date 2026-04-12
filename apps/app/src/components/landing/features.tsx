import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog'
import {
  Activity,
  Bot,
  Brain,
  DraftingCompass,
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
              <h2 className="text-4xl font-semibold lg:text-5xl">{heading}</h2>
              <p className="mt-6">{description}</p>
            </div>
            <ul className="mt-8 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
              {features.map((feature, index) => (
                <li key={index}>
                  <feature.icon className="size-5" />
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
    heading: 'AI-Optimized Resume Builder',
    description:
      'Our intelligent resume builder helps you create professional, ATS-friendly resumes that highlight your most relevant skills and experiences for each job application.',
    features: [
      { icon: Brain, text: 'Job-specific optimization that increases interview chances' },
      { icon: Activity, text: 'Keyword analysis to match requirements in job descriptions' },
      { icon: Shield, text: 'ATS compatibility scoring and improvement suggestions' },
      { icon: DraftingCompass, text: 'Multiple premium and free templates' },
    ],
    video: {
      src: '/resume-optimization.mp4',
    },
    orientation: 'right' as const,
  },
  {
    heading: 'AI Cover Letter Generator',
    description:
      'Create personalized cover letters in minutes with our AI-powered tool that adapts to each specific job application, highlighting your most relevant qualifications.',
    features: [
      { icon: Bot, text: 'AI-generated content tailored to job descriptions' },
      { icon: Zap, text: 'Create compelling cover letters in under 5 minutes' },
      { icon: Mail, text: "Match your resume's design and content for consistency" },
      { icon: Activity, text: 'Built-in editor with formatting and customization options' },
    ],
    video: {
      src: '/cover-letter.mp4',
    },
    orientation: 'left' as const,
  },
  {
    heading: 'Job Application Tracker',
    description:
      'Stay organized throughout your job search with our intuitive Kanban-style tracking system that helps you manage applications, interviews, and offers all in one place.',
    features: [
      { icon: Activity, text: 'Visual Kanban board for tracking application statuses' },
      { icon: Bot, text: 'Application reminders and follow-up notifications' },
      { icon: Shield, text: 'Store and organize job descriptions and requirements' },
      { icon: Brain, text: 'Track interview stages and feedback' },
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
