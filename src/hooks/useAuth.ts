import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { readAuthAvatarUrl } from '@/lib/profileAvatar'
import { sleep } from '@/lib/authSession'
import type { Profile } from '@/types/app.types'
import type { Session } from '@supabase/supabase-js'

const AUTH_INIT_FAILSAFE_MS = 12_000
const PROFILE_FETCH_TIMEOUT_MS = 20_000
const PROFILE_RETRIES = 3
const SESSION_RECOVER_RETRIES = 3

async function getSessionWithRetry(): Promise<Session | null> {
  let lastError: string | undefined
  for (let attempt = 0; attempt < SESSION_RECOVER_RETRIES; attempt++) {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      lastError = error.message
      await sleep(400 * (attempt + 1))
      continue
    }
    if (session) return session
    return null
  }
  if (lastError) console.error('getSession:', lastError)
  return null
}

export async function loadProfile(userId: string, authAvatarUrl?: string | null) {
  const store = useAuthStore.getState()
  const previous = store.profile?.id === userId ? store.profile : null

  for (let attempt = 0; attempt < PROFILE_RETRIES; attempt++) {
    const query = supabase.from('profiles').select('*').eq('id', userId).single()
    const timeout = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      window.setTimeout(
        () => resolve({ data: null, error: { message: 'profile fetch timeout' } }),
        PROFILE_FETCH_TIMEOUT_MS,
      )
    })

    try {
      const { data, error } = await Promise.race([query, timeout])
      if (error) {
        console.error('profiles:', error.message, `(attempt ${attempt + 1}/${PROFILE_RETRIES})`)
        if (attempt < PROFILE_RETRIES - 1) {
          await sleep(800 * (attempt + 1))
          continue
        }
        if (previous) {
          store.setProfile(previous)
          return
        }
        store.setProfile(null)
        return
      }

      const row = (data ?? null) as Profile | null
      if (!row) {
        if (previous) {
          store.setProfile(previous)
          return
        }
        store.setProfile(null)
        return
      }

      const avatarUrl = authAvatarUrl ?? row.avatar_url ?? null
      const merged: Profile = avatarUrl ? { ...row, avatar_url: avatarUrl } : row
      if (avatarUrl && row.avatar_url !== avatarUrl) {
        void supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
      }
      store.setProfile(merged)
      return
    } catch (e) {
      console.error('profiles load:', e, `(attempt ${attempt + 1}/${PROFILE_RETRIES})`)
      if (attempt < PROFILE_RETRIES - 1) {
        await sleep(800 * (attempt + 1))
        continue
      }
      if (previous) {
        store.setProfile(previous)
        return
      }
      store.setProfile(null)
    }
  }
}

function applySession(session: Session | null) {
  const { setUser, reset } = useAuthStore.getState()
  if (!session?.user) {
    reset()
    return
  }
  setUser(session.user)
  window.setTimeout(() => {
    void loadProfile(session.user.id, readAuthAvatarUrl(session.user.user_metadata))
  }, 0)
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

    void (async () => {
      try {
        const session = await getSessionWithRetry()
        if (session?.user) {
          setUser(session.user)
          window.setTimeout(() => {
            void loadProfile(session.user.id, readAuthAvatarUrl(session.user.user_metadata))
          }, 0)
        } else {
          setUser(null)
        }
      } catch (e) {
        console.error('getSession failed:', e)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only clear auth on explicit sign-out — transient null session during refresh must not log users out.
      if (event === 'SIGNED_OUT') {
        reset()
        return
      }

      if (session?.user) {
        window.setTimeout(() => applySession(session), 0)
        return
      }

      // Rare: event without session (e.g. failed refresh). Re-check storage before clearing.
      if (event === 'INITIAL_SESSION') return

      window.setTimeout(() => {
        void (async () => {
          const recovered = await getSessionWithRetry()
          if (recovered?.user) {
            applySession(recovered)
            return
          }
          if (useAuthStore.getState().user) {
            console.warn('[auth] session missing after', event, '— signing out')
            reset()
          }
        })()
      }, 0)
    })

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void (async () => {
        const recovered = await getSessionWithRetry()
        const state = useAuthStore.getState()
        if (!recovered?.user) return
        if (!state.user || state.user.id !== recovered.user.id) {
          applySession(recovered)
          return
        }
        if (!state.profileHydrated || !state.profile) {
          window.setTimeout(() => {
            void loadProfile(recovered.user.id, readAuthAvatarUrl(recovered.user.user_metadata))
          }, 0)
        }
      })()
    }

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearTimeout(failsafe)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [setUser, setLoading, reset])
}
