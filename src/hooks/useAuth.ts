import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Profile } from '@/types/app.types'

const AUTH_INIT_FAILSAFE_MS = 12_000

export function useAuthInit() {
  const { setUser, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    const failsafe = window.setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        console.warn('Auth init exceeded timeout; clearing loading state.')
        useAuthStore.getState().setLoading(false)
      }
    }, AUTH_INIT_FAILSAFE_MS)

    supabase.auth
      .getSession()
      .then(async (result) => {
        try {
          const { data: { session }, error: sessionError } = result
          if (sessionError) {
            console.error('getSession:', sessionError.message)
            return
          }
          if (session?.user) {
            setUser(session.user)
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (error) {
              console.error('profiles (getSession):', error.message)
              setProfile(null)
            } else {
              setProfile(data as Profile | null)
            }
          }
        } catch (e) {
          console.error('Auth init (getSession):', e)
        } finally {
          setLoading(false)
        }
      })
      .catch((e) => {
        console.error('getSession failed:', e)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          reset()
          return
        }
        try {
          if (session?.user) {
            setUser(session.user)
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (error) {
              console.error('profiles (onAuthStateChange):', error.message)
              setProfile(null)
            } else {
              setProfile(data as Profile | null)
            }
          }
        } catch (e) {
          console.error('Auth state handler:', e)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      window.clearTimeout(failsafe)
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading, reset])
}
