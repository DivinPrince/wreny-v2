import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/cover-letters/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/cover-letters/"!</div>
}
