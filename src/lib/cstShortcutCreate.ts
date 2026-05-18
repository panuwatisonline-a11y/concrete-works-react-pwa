import { supabase } from '@/lib/supabase'
import { CST_LIST_STATUS_ID } from '@/lib/cstListData'
import { NON_SYSTEM_BOOKING_REMARK } from '@/lib/nonSystemBooking'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'

export type CstShortcutCreateInput = {
  client_id: number
  abc_code_id: number | null
  wbs_code_id: number | null
  concrete_work_id: number
  location_id: number
  structure_id: number
  structure_no: string | null
  casting_date: string
  mixcode_id: number
  volume_confirm: number
}

export async function createCstShortcutRequest(
  input: CstShortcutCreateInput,
  userId: string,
): Promise<{ id: string } | { error: string }> {
  const now = new Date().toISOString()
  const { data: req, error } = await supabase
    .from('Request')
    .insert({
      status_id: CST_LIST_STATUS_ID,
      booked_by: userId,
      booked_at: now,
      confirmed_by: userId,
      confirmed_at: now,
      request_date: now.split('T')[0],
      request_time: '09:00',
      client_id: input.client_id,
      abc_code_id: input.abc_code_id,
      wbs_code_id: input.wbs_code_id,
      concrete_work_id: input.concrete_work_id,
      location_id: input.location_id,
      structure_id: input.structure_id,
      structure_no: input.structure_no,
      casting_date: input.casting_date,
      mixcode_id: input.mixcode_id,
      volume_confirm: input.volume_confirm,
      remarks: NON_SYSTEM_BOOKING_REMARK,
    })
    .select('id')
    .single()

  if (error || !req) return { error: error?.message ?? 'เกิดข้อผิดพลาด' }

  const { error: logErr } = await supabase.from('Request_Log').insert({
    request_id: req.id,
    status_id: CST_LIST_STATUS_ID,
    action: 'completed',
    action_by: userId,
    note: 'สร้างจาก CST shortcut',
  })
  if (logErr) return { error: logErr.message }

  await notifyRequestListChanged()
  return { id: req.id }
}
