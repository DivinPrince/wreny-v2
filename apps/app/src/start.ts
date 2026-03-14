import { auth } from '@repo/core/auth'
import { createMiddleware, createStart } from '@tanstack/react-start'

function isProtectedPath(pathname: string) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/resume-pdf/')
  )
}

const dashboardAuthMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url)

  if (!isProtectedPath(url.pathname)) {
    return next()
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (session) {
    return next()
  }

  return Response.redirect(new URL('/signin', url))
})

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [dashboardAuthMiddleware],
  }
})
