import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/app.types'

interface AuthState {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) =>
    set({ profile, role: profile?.role ?? null }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, profile: null, role: null, isLoading: false }),
}))
