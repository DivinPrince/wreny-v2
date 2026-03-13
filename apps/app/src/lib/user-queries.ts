import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { useSession } from './auth-client'

export function useUserProfile() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.users.me(),
    enabled: !!session?.user,
  })
}

export function useUserAddresses() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['users', 'me', 'addresses'],
    queryFn: () => api.users.listAddresses(),
    enabled: !!session?.user,
  })
}
