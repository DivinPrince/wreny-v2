import { createMiddleware, createStart } from '@tanstack/react-start'

const API_URL = process.env.API_URL

function isProtectedPath(pathname: string) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/resume-pdf/')
  )
}

async function hasSession(request: Request) {
  if (!API_URL) {
    return false
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: request.headers,
    })

    if (!response.ok) {
      return false
    }

    const session = (await response.json().catch(() => null)) as unknown
    return Boolean(session)
  } catch {
    return false
  }
}

const dashboardAuthMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url)

  if (!isProtectedPath(url.pathname)) {
    return next()
  }

  if (await hasSession(request)) {
    return next()
  }

  return Response.redirect(new URL('/signin', url))
})

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [dashboardAuthMiddleware],
  }
})
