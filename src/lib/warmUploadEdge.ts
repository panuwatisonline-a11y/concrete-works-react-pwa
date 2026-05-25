import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase'

let warmRequested = false

/**
 * ยิง Edge Function ครั้งเดียวต่อ session — ลด cold start ตอนอัปโหลดรูปครั้งแรก
 */
export function warmUploadEdgeFunction(): void {
  if (!isSupabaseConfigured || warmRequested) return
  warmRequested = true

  void (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/upload-drive-image`
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'warm' }),
        keepalive: true,
      })
    } catch {
      warmRequested = false
    }
  })()
}
