import { supabase } from '@/lib/supabase'

/**
 * บันทึก Request_Log action `booked` ครั้งเดียวต่อคำขอ — กันซ้ำจาก trigger + แอป หรือ double-submit
 */
export async function ensureBookedRequestLog(requestId: string, userId: string): Promise<{ error: string | null }> {
  const { data: rows, error: selErr } = await supabase
    .from('Request_Log')
    .select('id')
    .eq('request_id', requestId)
    .eq('action', 'booked')
    .limit(1)

  if (selErr) return { error: selErr.message }
  if (rows && rows.length > 0) return { error: null }

  const { error: insErr } = await supabase.from('Request_Log').insert({
    request_id: requestId,
    status_id: 1,
    action: 'booked',
    action_by: userId,
  })

  if (!insErr) return { error: null }
  // หลังมี unique partial index: แข่งกัน insert พร้อมกัน → 23505 = มีแถวแล้ว
  if (insErr.code === '23505') return { error: null }
  return { error: insErr.message }
}
