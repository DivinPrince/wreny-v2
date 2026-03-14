import { AppSidebar } from '#/components/app-sidebar'
import { DashboardHeader } from '#/components/dashboard-header'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return  <SidebarProvider>
  <AppSidebar />
  <SidebarInset className="overflow-x-hidden">
    <DashboardHeader />
      <Outlet />
  </SidebarInset>
</SidebarProvider>
}
