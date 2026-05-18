import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { readAuthAvatarUrl } from '@/lib/profileAvatar'
import type { Profile } from '@/types/app.types'

const AUTH_INIT_FAILSAFE_MS = 8_000
const PROFILE_FETCH_TIMEOUT_MS = 14_000

export async function loadProfile(userId: string, authAvatarUrl?: string | null) {
  const { setProfile } = useAuthStore.getState()
  const query = supabase.from('profiles').select('*').eq('id', userId).single()
  const timeout = new Promise<{ data: null; error: { message: string } }>((resolve) => {
    window.setTimeout(() => resolve({ data: null, error: { message: 'profile fetch timeout' } }), PROFILE_FETCH_TIMEOUT_MS)
  })
  try {
    const { data, error } = await Promise.race([query, timeout])
    if (error) {
      console.error('profiles:', error.message)
      setProfile(null)
      return
    }
    const row = (data ?? null) as Profile | null
    if (!row) {
      setProfile(null)
      return
    }
    const avatarUrl = authAvatarUrl ?? row.avatar_url ?? null
    const merged: Profile = avatarUrl ? { ...row, avatar_url: avatarUrl } : row
    if (avatarUrl && row.avatar_url !== avatarUrl) {
      void supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
    }
    setProfile(merged)
  } catch (e) {
    console.error('profiles load:', e)
    setProfile(null)
  }
}

export function useAuthInit() {
  const { setUser, setLoading, reset } = useAuthStore()

  useEffect(() => {
    const failsafe = window.setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        console.warn('Auth init exceeded timeout; clearing loading state.')
        useAuthStore.getState().setLoading(false)
      }
    }, AUTH_INIT_FAILSAFE_MS)

    void supabase.auth
      .getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (sessionError) {
          console.error('getSession:', sessionError.message)
          setUser(null)
          setLoading(false)
          return
        }
        if (session?.user) {
          setUser(session.user)
          void loadProfile(session.user.id, readAuthAvatarUrl(session.user.user_metadata))
        } else {
          setUser(null)
        }
        setLoading(false)
      })
      .catch((e) => {
        console.error('getSession failed:', e)
        setUser(null)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        reset()
        return
      }
      try {
        if (session.user) {
          setUser(session.user)
          void loadProfile(session.user.id, readAuthAvatarUrl(session.user.user_metadata))
        }
      } catch (e) {
        console.error('Auth state handler:', e)
      }
    })

    return () => {
      window.clearTimeout(failsafe)
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, reset])
}
