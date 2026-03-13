import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"

import { SignOut } from "#/components/sign-out"
import { Button } from "#/components/ui/button"
import { Icons } from "#/components/ui/icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "#/components/ui/sidebar"
import { useSession } from "#/lib/auth-client"

const navRoutes = [
  { title: "Dashboard", to: "/dashboard", icon: Icons.Dashboard },
  { title: "Resumes", to: "/dashboard/resume", icon: Icons.FileIcon1 },
  { title: "Cover Letters", to: "/dashboard/cover-letters", icon: Icons.FileIcon2 },
  { title: "Job Tracker", to: "/dashboard/jobs", icon: Icons.LayoutDashboard },
] as const

function AppSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { data: session } = useSession()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="mb-2 h-16 justify-center">
        <div className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:px-0">
          <Link className="inline-flex items-center gap-3 overflow-hidden rounded-md" to="/dashboard">
            <Icons.Logo className="shrink-0" />
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold">Wreny</p>
              <p className="text-xs text-muted-foreground">Career workspace</p>
            </div>
          </Link>
          <SidebarTrigger
            className="text-muted-foreground/80 hover:bg-transparent hover:text-foreground/80"
            icon={<Icons.PanelRightOpen />}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarMenu>
          {navRoutes.map((item) => {
            const isActive =
              pathname === item.to || pathname.startsWith(`${item.to}/`)

            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link to={item.to}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        <SidebarRail />
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4">
        <div className="rounded-xl border bg-background p-3 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{session?.user?.name ?? "Guest"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user?.email ?? "Sign in to sync"}
              </p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function DashboardHeader({
  title,
  description,
  actions,
}: Readonly<{
  title: string
  description: string
  actions?: React.ReactNode
}>) {
  const { state, isMobile } = useSidebar()
  const showTrigger = isMobile || state === "collapsed"

  return (
    <header className="sticky top-0 z-20 flex shrink-0 flex-col gap-4 border-b bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {showTrigger ? (
            <SidebarTrigger className="-ml-1 mt-1" icon={<Icons.PanelLeftOpen />} />
          ) : null}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions}
          <Button variant="outline" className="rounded-full">
            Upgrade
          </Button>
          <SignOut />
        </div>
      </div>
    </header>
  )
}

export function DashboardShell({
  children,
  title,
  description,
  actions,
}: Readonly<{
  children: React.ReactNode
  title: string
  description: string
  actions?: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden">
        <DashboardHeader title={title} description={description} actions={actions} />
        <div className="min-h-[calc(100svh-5rem)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.86),transparent_24%),linear-gradient(180deg,#fbf8f3_0%,#f3eadc_35%,#f8fafc_100%)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
