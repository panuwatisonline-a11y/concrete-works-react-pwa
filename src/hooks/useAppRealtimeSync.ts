import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { loadProfile } from '@/hooks/useAuth'
import { readAuthAvatarUrl } from '@/lib/profileAvatar'
import { useDataSyncOnTables } from '@/hooks/useDataSyncOnTables'
import { useAuthStore } from '@/stores/authStore'
import {
  dispatchVisibilityResync,
  handleRealtimePostgresChange,
} from '@/lib/dataSyncEvents'

/** ตารางที่เปิด Realtime publication (ต้องตรงกับ migration) */
const REALTIME_TABLES = [
  'Request',
  'Request_Log',
  'CST',
  'profiles',
  'Status',
  'Client',
  'Location',
  'Concrete Works',
  'Structure',
  'Mixed Code',
  'ABC Code',
  'ABC Code1',
  'ABC Code2',
  'ABC Code3',
  'ABC Code4',
  'WBS Code',
  'WBS1',
  'WBS2',
  'WBS3',
  'WBS4',
  'WBS5',
  'WBS6',
  'WBS7',
  'Jobs',
  'Compression Machine',
  'Inspector',
  'Inspector_Member',
] as const

const CHANNEL_NAME = 'pour-app-realtime'

/**
 * Subscribe Supabase Realtime ครั้งเดียวต่อ session (เมื่อ login)
 * + resync เมื่อกลับมาแท็บ
 */
export function useAppRealtimeSync(): void {
  const userId = useAuthStore((s) => s.user?.id)
  const user = useAuthStore((s) => s.user)

  useDataSyncOnTables(['profiles'], (detail) => {
    if (!userId) return
    if (detail.recordId && detail.recordId !== userId) return
    void loadProfile(userId, readAuthAvatarUrl(user?.user_metadata))
  })

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return

    let channel = supabase.channel(CHANNEL_NAME)

    for (const table of REALTIME_TABLES) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          handleRealtimePostgresChange({
            table: payload.table,
            eventType: payload.eventType,
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
          })
        },
      )
    }

    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' && err) {
        console.warn('[realtime]', err.message)
      }
    })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        dispatchVisibilityResync()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userId])
}
