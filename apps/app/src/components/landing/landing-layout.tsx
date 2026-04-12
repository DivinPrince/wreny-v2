import type { ReactNode } from 'react'

import { Footer } from '#/components/landing/footer'
import { Header } from '#/components/landing/header'

export function LandingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 overflow-hidden md:overflow-visible">
        {children}
      </main>
      <Footer />
    </div>
  )
}
