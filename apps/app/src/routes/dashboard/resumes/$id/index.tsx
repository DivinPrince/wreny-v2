import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/resumes/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/dashboard/resumes/$id/$step',
      params: {
        id: params.id,
        step: 'contact',
      },
    })
  },
})
