"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "#/components/ui/sidebar"
import { Link, useRouterState } from "@tanstack/react-router"
import { Icons } from "#/components/ui/icons"
import { cn } from "#/lib/utils"

type NavRoute = {
  title: string
  url: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  match: (path: string) => boolean
}

// Navigation routes definition
const navRoutes: NavRoute[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Icons.Dashboard,
    match: (path: string) =>
      path === "/dashboard" || path === "/dashboard/",
  },
  {
    title: "Resumes",
    url: "/dashboard/resumes",
    icon: Icons.FileIcon1,
    match: (path: string) => path.startsWith("/dashboard/resumes"),
  },
  {
    title: "Cover Letters",
    url: "/dashboard/cover-letters",
    icon: Icons.FileIcon2,
    match: (path: string) => path.startsWith("/dashboard/cover-letters"),
  },
  {
    title: "Job Tracker",
    url: "/dashboard/jobs",
    icon: Icons.LayoutDashboard,
    match: (path: string) => path.startsWith("/dashboard/jobs"),
  },
  {
    title: "Agent",
    url: "/dashboard/agent",
    icon: Icons.AiBeautify,
    match: (path: string) => path.startsWith("/dashboard/agent"),
  },
]

function SidebarLogo() {
  return (
    <div className="flex gap-1.5 px-1.5 group-data-[collapsible=icon]:px-0 transition-[padding] duration-200 ease-in-out justify-between items-center">
      <Link
        className="group/logo inline-flex"
        to="/"
      >
        <span className="sr-only">Logo</span>
        <Icons.Logo className="size-7" />
      </Link>
      <SidebarTrigger>
        <Icons.PanelRightOpen className="size-4 text-muted-foreground/80 hover:text-foreground/80 hover:bg-transparent!" />
      </SidebarTrigger>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="h-12 shrink-0 px-2.5 py-2">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent className="px-2.5 [&>li]:list-none gap-1">
        {navRoutes.map((item) => {
          const isActive = item.match(pathname)

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={isActive}
                asChild
                className={cn(
                  "relative h-10 gap-2.5 px-3 py-2 text-[0.9375rem] leading-snug [&_svg]:size-[1.125rem]",
                  isActive &&
                    "bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary"
                )}
              >
                <Link to={item.url}>
                  <item.icon />
                  {item.title}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
        <SidebarRail />
      </SidebarContent>
    </Sidebar>
  )
}
