import { Icons } from '#/components/ui/icons'
import { Link } from '@tanstack/react-router'

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
    title: 'Templates',
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
    alt: 'YouTube',
  },
  {
    href: 'https://www.x.com/divinprnc',
    icon: '/icons/x.svg',
    alt: 'X',
  },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block">
              <Icons.LogoWithText className="h-8 w-28 brightness-0 invert" />
            </Link>
            <p className="mt-4 text-sm text-background/60 max-w-[240px] leading-relaxed">
              Resumes, cover letters, and applications—in one place.
            </p>
            <div className="mt-5 flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <img
                    src={social.icon}
                    height={16}
                    width={16}
                    alt={social.alt}
                    className="brightness-0 invert"
                  />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-background/60 hover:text-background transition-colors"
                      {...(link.isExternal
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">
            Copyright © {new Date().getFullYear()} Wreny. All rights reserved.
          </p>
          <a href="#" className="text-xs text-background/40 hover:text-background transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  )
}
