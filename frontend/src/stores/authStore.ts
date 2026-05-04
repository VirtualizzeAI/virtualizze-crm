import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AuthUser } from '../lib/types'

interface LoginPayload {
  token: string
  user: AuthUser
  organization_id: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  organization_id: string | null
  login: (payload: LoginPayload) => void
  syncProfile: (payload: Omit<LoginPayload, 'token'>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      organization_id: null,
      login: ({ token, user, organization_id }) => {
        set({ token, user, organization_id })
      },
      syncProfile: ({ user, organization_id }) => {
        set((state) => ({ token: state.token, user, organization_id }))
      },
      logout: () => {
        set({ token: null, user: null, organization_id: null })
      },
    }),
    {
      name: 'virtualizze-auth-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)