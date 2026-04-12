import CoverLetters from '#/components/landing/cover-letters'
import CTA from '#/components/landing/cta'
import FAQ from '#/components/landing/faq'
import Features from '#/components/landing/features'
import Hero from '#/components/landing/hero'
import Pricing from '#/components/landing/pricing'
import ResumeTemplates from '#/components/landing/resume-templates'

export function StartPage() {
  return (
    <>
      <Hero />
      <Features />
      <ResumeTemplates />
      <CoverLetters />
      <Pricing />
      <FAQ />
      <CTA />
    </>
  )
}
