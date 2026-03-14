import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/cover-letters/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/cover-letters/$id"!</div>
}
