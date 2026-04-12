import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'Is there a free version?',
    answer:
      'Yes. You can start on the free tier with core resume and cover letter features. Upgrade when you need more documents, exports, or AI capacity.',
  },
  {
    question: 'How does the AI help with my resume?',
    answer:
      'You bring your experience; the product helps you align wording and emphasis with a specific job. The goal is a resume a recruiter can scan quickly and that still reflects what you actually did.',
  },
  {
    question: 'Will my resume work with applicant tracking systems?',
    answer:
      'We prioritize clean structure and readable templates. You still choose what to include, but the layouts avoid common pitfalls that confuse parsers—without looking like a plain text file.',
  },
  {
    question: 'What formats can I export?',
    answer:
      'Free accounts export to PDF. Pro and Lifetime include additional formats such as Word and plain text so you can submit the file a recruiter or portal asks for.',
  },
  {
    question: 'How many resumes can I save?',
    answer:
      'On the free tier you can maintain one saved resume. Pro and Lifetime unlock unlimited resumes so you can keep a version per industry or seniority level.',
  },
  {
    question: 'How do you handle my data?',
    answer:
      'We encrypt data in transit and store it securely. We do not sell your personal information. You can request deletion in line with our support and privacy policies.',
  },
  {
    question: 'Can I cancel a subscription?',
    answer:
      'Yes. Cancel anytime from your account. You keep paid features until the end of the period you already paid for.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'New subscriptions include a 14-day money-back window. Email support within 14 days of purchase if the product is not a fit—we will process eligible refunds according to our policy.',
  },
]

export default function FAQ() {
  return (
    <section className="py-14 bg-secondary/30" id="faq">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold lg:text-3xl mb-3">Questions, answered</h2>
          <p className="text-[0.95rem] text-muted-foreground max-w-2xl mx-auto">
            Straight answers about pricing, exports, and how Wreny fits into a real job search.
          </p>
        </div>

        <div className="divide-y border-y border-border">
          {faqItems.map((item, index) => (
            <details key={index} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[0.95rem] font-medium text-left [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Still stuck?{' '}
            <a href="mailto:divin@wreny.app" className="text-primary font-medium hover:underline">
              Email divin@wreny.app
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
