import type { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowRight, FileText, Layers3, PenSquare, Sparkles } from 'lucide-react'

import { useSession } from '#/lib/auth-client'

const navItems = [
  { to: '/resume', label: 'Overview' },
  { to: '/resume/templates', label: 'Templates' },
  { to: '/resumes', label: 'Studio' },
  { to: '/cover-letters', label: 'Cover Letters' },
] as const

function NavLink({
  to,
  label,
}: Readonly<{
  to: (typeof navItems)[number]['to']
  label: string
}>) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isActive = pathname === to || pathname.startsWith(`${to}/`)

  return (
    <Link
      to={to}
      className={
        isActive
          ? 'rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white'
          : 'rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950'
      }
    >
      {label}
    </Link>
  )
}

export function ResumeSiteShell({
  children,
  eyebrow = 'Unified Resume Frontend',
  title,
  description,
  actions,
}: Readonly<{
  children: ReactNode
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}>) {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f9f5ef_0%,#efe6d7_45%,#f8fafc_100%)] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-8 rounded-[2rem] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.28)]">
                <Layers3 size={22} />
              </div>
              <div>
                <p className="font-[Newsreader] text-xl font-semibold tracking-[0.02em]">Wreny Studio</p>
                <p className="text-sm text-slate-500">Templates, preview, editing, and exports in one app.</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} label={item.label} />
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {session?.user ? (
                <Link
                  to="/resumes"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  <PenSquare size={16} />
                  Open Studio
                </Link>
              ) : (
                <Link
                  to="/resumes/$resumeId"
                  params={{ resumeId: 'sample' }}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Sparkles size={16} />
                  Explore Sample
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">
              <FileText size={14} />
              {eyebrow}
            </p>
            <div className="space-y-3">
              <h1 className="max-w-4xl font-[Newsreader] text-5xl font-semibold leading-[0.94] tracking-[-0.03em] text-slate-950 sm:text-6xl">
                {title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">{description}</p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </section>

        {children}

        <footer className="mt-14 rounded-[2rem] border border-slate-200/80 bg-white/70 px-6 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-[Newsreader] text-2xl font-semibold">No more separate artboard app.</p>
              <p className="text-sm text-slate-600">
                Templates, gallery, dashboard, and editor now live in one frontend runtime.
              </p>
            </div>
            <Link to="/resume/templates" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              Browse template system
              <ArrowRight size={15} />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
