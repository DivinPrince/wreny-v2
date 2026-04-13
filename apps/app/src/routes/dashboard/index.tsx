import { createFileRoute } from '@tanstack/react-router'

import { DashboardHome } from '#/features/dashboard/components/dashboard-home'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DashboardHome />
}
