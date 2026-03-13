import { createFileRoute } from '@tanstack/react-router'
import SectionHeading from '../components/SectionHeading'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap section-stack py-12">
      <section className="story-panel">
        <SectionHeading eyebrow="About" title="Built for projects that cannot afford guesswork." />
        <p className="story-copy">
          1000 Hills Engineering combines product sourcing, MEP expertise, and
          technical field support into one delivery channel. The goal is simple:
          give contractors, developers, and operators a dependable partner for
          critical equipment and engineering guidance.
        </p>
      </section>
    </main>
  )
}
