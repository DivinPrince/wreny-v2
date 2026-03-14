import { AppSidebar } from '#/components/app-sidebar'
import { DashboardHeader } from '#/components/dashboard-header'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

// Routes where the sidebar is hidden by default (editor pages need more space)
const SIDEBAR_HIDDEN_ROUTES = [
  (path: string) => /^\/dashboard\/resumes\/[^/]+\/?/.test(path),
  (path: string) => /^\/dashboard\/cover-letters\/[^/]+\/?/.test(path),
]

function isSidebarHiddenByDefault(pathname: string) {
  return SIDEBAR_HIDDEN_ROUTES.some((match) => match(pathname))
}

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const hideSidebar = isSidebarHiddenByDefault(pathname)
  const [sidebarOpen, setSidebarOpen] = useState(!hideSidebar)

  useEffect(() => {
    if (hideSidebar) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [hideSidebar])

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden">
        <DashboardHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
