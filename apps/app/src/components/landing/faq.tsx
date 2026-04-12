import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'Is Wreny free to use?',
    answer:
      'Yes, Wreny offers a free tier that includes basic resume building features. We also offer premium plans with advanced features for serious job seekers.',
  },
  {
    question: 'How does the AI resume builder work?',
    answer:
      'Our AI resume builder analyzes your experience and skills, then generates tailored content that highlights your qualifications. It also optimizes your resume for Applicant Tracking Systems (ATS) to increase your chances of getting past automated screenings.',
  },
  {
    question: 'Are the resumes created with Wreny ATS-friendly?',
    answer:
      "Absolutely! All our templates are designed to be ATS-friendly. Our system also provides suggestions to improve your resume's compatibility with ATS systems and increases your chances of getting your resume seen by hiring managers.",
  },
  {
    question: 'Can I export my resume in different formats?',
    answer:
      'Yes, you can export your resume as a PDF file with our free plan. Premium plans allow exporting in additional formats like Word, TXT, and more.',
  },
  {
    question: 'How many resumes can I create?',
    answer:
      'Free users can create and save one resume. Pro users can create unlimited resumes, allowing you to tailor different versions for different job applications.',
  },
  {
    question: 'Is my data secure with Wreny?',
    answer:
      'Yes, we take data security very seriously. All your data is encrypted and stored securely. We never share your personal information with third parties without your consent.',
  },
  {
    question: 'Can I cancel my subscription at any time?',
    answer:
      "Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access to premium features until the end of your billing cycle.",
  },
  {
    question: 'Do you offer refunds?',
    answer:
      "We offer a 14-day money-back guarantee for all new subscriptions. If you're not satisfied with our service, contact our support team within 14 days of purchase for a full refund.",
  },
]

export default function FAQ() {
  return (
    <section className="py-20 bg-secondary/30" id="faq">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold lg:text-5xl mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Wreny and how it can help your job search.
          </p>
        </div>

        <div className="divide-y border-y border-border">
          {faqItems.map((item, index) => (
            <details key={index} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium text-left [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Still have questions?{' '}
            <a href="mailto:support@wreny.app" className="text-primary font-medium hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
