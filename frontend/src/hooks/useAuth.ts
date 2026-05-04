import { useMutation, useQuery } from '@tanstack/react-query'

import { login, logout, me } from '../api/auth'
import type { LoginRequest } from '../lib/types'

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
  })
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => logout(),
  })
}

export function useMeQuery(token: string | null) {
  return useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => me(),
    enabled: Boolean(token),
    retry: false,
  })
}