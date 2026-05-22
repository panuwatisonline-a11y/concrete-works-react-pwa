import { toast } from 'sonner'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/supabase'
import { isFullyOnline, useConnectivityStore } from '@/stores/connectivityStore'

const PROBE_TIMEOUT_MS = 8_000

export const CONNECTIVITY_MESSAGES = {
  offline:
    'ออฟไลน์ — แสดงข้อมูลที่บันทึกไว้ การเปลี่ยนแปลงจะเข้าคิวและส่งเมื่อเชื่อมต่อได้',
  degraded:
    'เชื่อมต่อระบบไม่ได้ — ใช้ข้อมูลที่บันทึกไว้ และคิวส่งอัตโนมัติเมื่อพร้อม',
  syncing: 'กำลังซิงค์ข้อมูล…',
  flushingQueue: 'กำลังส่งรายการในคิว…',
  pendingQueue: (n: number) => `รอส่ง ${n} รายการ — จะส่งอัตโนมัติเมื่อเชื่อมต่อได้`,
  viewingCache: 'กำลังแสดงข้อมูลที่บันทึกไว้ (อาจไม่ตรงกับเซิร์ฟเวอร์)',
} as const

/** ตรวจว่า Supabase REST ตอบได้ (ไม่พึ่งแค่ navigator.onLine) */
export async function probeBackendReachable(): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const base = supabaseUrl.replace(/\/$/, '')
  const url = `${base}/rest/v1/Status?select=id&limit=1`
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

/** @deprecated ใช้ runOrQueueMutation แทน */
export function requireOnlineAction(): boolean {
  if (isFullyOnline()) return true
  const phase = useConnectivityStore.getState().phase
  if (phase === 'syncing') {
    toast.message(CONNECTIVITY_MESSAGES.syncing)
    return false
  }
  return true
}
