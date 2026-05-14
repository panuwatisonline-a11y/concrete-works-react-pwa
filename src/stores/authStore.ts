import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/app.types'

interface AuthState {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  /** True until first getSession() settles (fast — does not wait for profiles). */
  isLoading: boolean
  /** False while logged in and profile row not loaded yet (blocks protected UI only). */
  profileHydrated: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  profileHydrated: true,
  setUser: (user) => {
    if (!user) {
      set({ user: null, profile: null, role: null, profileHydrated: true })
      return
    }
    const prev = get().user
    if (prev?.id === user.id) {
      set({ user })
      return
    }
    set({ user, profile: null, role: null, profileHydrated: false })
  },
  setProfile: (profile) => set({ profile, role: profile?.role ?? null, profileHydrated: true }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, profile: null, role: null, isLoading: false, profileHydrated: true }),
}))
