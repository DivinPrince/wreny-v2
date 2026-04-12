import { Icons } from '#/components/ui/icons'
import { Separator } from '#/components/ui/separator'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

interface FooterLink {
  href: string
  label: string
  isExternal?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { href: '#resume-builder', label: 'Resume Builder' },
      { href: '#resume-optimizer', label: 'Resume Optimizer' },
      { href: '#cover-letter-builder', label: 'Cover Letter Builder' },
      { href: '#ai-cover-letter-writer', label: 'AI Cover Letter writer' },
      { href: '#ai-resume-builder', label: 'AI Resume Builder' },
      { href: '#job-tracker', label: 'Job Tracker' },
      { href: '#pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '#resume-examples', label: 'Resume Examples' },
      { href: '#cover-letter-examples', label: 'Cover Letter Examples' },
    ],
  },
  {
    title: 'Design Templates',
    links: [
      { href: '#resumes', label: 'Resume Templates' },
      { href: '#ats-resumes', label: 'ATS Resume Templates' },
      { href: '#free-resumes', label: 'Free Resume Templates' },
      { href: '#professional-resumes', label: 'Professional Resume Templates' },
      { href: '#creative-resumes', label: 'Creative Resume Templates' },
    ],
  },
]

const socialLinks = [
  {
    href: 'https://www.youtube.com/@divinprince',
    icon: '/icons/youtube.svg',
    alt: 'YouTube logo',
  },
  {
    href: 'https://www.x.com/divinprnc',
    icon: '/icons/x.svg',
    alt: 'X logo',
  },
]

export function Footer() {
  return (
    <footer className="bg-muted/80 border-t border-primary/10">
      <div className="mx-auto max-w-7xl px-8 py-24">
        <div className="flex flex-col flex-wrap lg:flex-row lg:flex-nowrap lg:items-start">
          <div className="flex flex-shrink-0 text-left lg:flex-col">
            <div className="flex-1">
              <Link
                to="/"
                aria-current="page"
                className="relative flex items-center justify-start gap-2"
              >
                <Icons.Logo />
              </Link>

              <p className="mt-3 text-sm text-primary/80">
                Optimize your job search &amp;
                <br /> resume with Wreny
              </p>

              <p className="mt-3 text-sm text-primary/60">
                Copyright © {new Date().getFullYear()} - All rights reserved
              </p>
            </div>
            <div className="mt-auto flex items-end gap-2 lg:items-center">
              {socialLinks.map((social, index) => (
                <Fragment key={social.href}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                    <img src={social.icon} height={16} width={16} alt={social.alt} />
                  </a>
                  {index < socialLinks.length - 1 ? (
                    <Separator orientation="vertical" className="h-6" />
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-grow flex-wrap text-center lg:mt-0 justify-between">
            {footerSections.map((section) => (
              <div key={section.title} className="flex flex-col items-start px-4">
                <div className="text-lg font-semibold mb-3 tracking-widest text-primary lg:text-left">
                  {section.title}
                </div>

                <div className="mb-10 flex flex-col justify-center gap-2 text-sm items-start">
                  {section.links.map((link) =>
                    link.isExternal ? (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary font-semibold"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        key={link.href}
                        href={link.href}
                        className="text-muted-foreground hover:text-primary font-semibold"
                      >
                        {link.label}
                      </a>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
