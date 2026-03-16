import { useEffect } from "react";
import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'

import appCss from '../styles.css?url'
import { ApiProvider } from '@repo/sdk/react'
import { api } from '#/lib/api'

export const Route = createRootRoute({
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
        title: 'Wreny',
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
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import("react-grab");
      void import("@react-grab/mcp/client");
    }
  }, []);

  return (
    <RootDocument>
      <ApiProvider api={api}>
        <NuqsAdapter>
          <Outlet />
        </NuqsAdapter>
      </ApiProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          src="https://cdn.databuddy.cc/databuddy.js"
          data-client-id="Md8dXYoZ2gNILeDN_mJa4"
          data-track-attributes="true"
          data-track-interactions="true"
          data-track-errors="true"
          crossOrigin="anonymous"
          async
        ></script>
      </head>
      <body className="font-sans antialiased wrap-anywhere">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
