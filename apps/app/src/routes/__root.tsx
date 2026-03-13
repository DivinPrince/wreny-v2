import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { StorefrontToastContainer } from '../components/Toast'
import { headerCategoriesQueryOptions } from '../lib/admin-queries'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  loader: ({ context }) => context.queryClient.ensureQueryData(headerCategoriesQueryOptions),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: '1000 Hills Engineering',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <RootDocument>
      {isAdminRoute ? null : <Header />}
      <Outlet />
      {isAdminRoute ? null : <Footer />}
      {isAdminRoute ? null : <StorefrontToastContainer />}
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere]">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
