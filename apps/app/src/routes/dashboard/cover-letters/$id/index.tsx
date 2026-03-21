import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/cover-letters/$id/')({
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: '/dashboard/cover-letters/$id/$step',
      params: {
        id: params.id,
        step: 'preview',
      },
      search,
    })
  },
})
