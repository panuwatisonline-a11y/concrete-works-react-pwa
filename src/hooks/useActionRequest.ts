import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

export function useActionRequest() {
  const { user } = useAuthStore()

  async function logAction(
    requestId: string,
    statusId: number,
    action: string,
    note?: string,
    extra?: Record<string, unknown>
  ) {
    await supabase.from('Request_Log').insert({
      request_id: requestId,
      status_id: statusId,
      action,
      action_by: user?.id,
      note: note ?? null,
      ...extra,
    })
  }

  async function inspect(
    requestId: string,
    note?: string,
    corrections?: {
      location_id: number
      concrete_work_id: number
      structure_id: number
      structure_no: string | null
      mixcode_id: number
      volume_request: number
      before_image: string | null
    },
  ) {
    const payload: Record<string, unknown> = {
      status_id: 2,
      inspected_by: user?.id,
      inspected_at: new Date().toISOString(),
    }
    if (corrections) {
      payload.location_id = corrections.location_id
      payload.concrete_work_id = corrections.concrete_work_id
      payload.structure_id = corrections.structure_id
      payload.structure_no = corrections.structure_no
      payload.mixcode_id = corrections.mixcode_id
      payload.volume_request = corrections.volume_request
      payload.before_image = corrections.before_image
    }
    const { error } = await supabase.from('Request').update(payload).eq('id', requestId)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return false }
    await logAction(requestId, 2, 'inspected', note)
    toast.success('ตรวจสอบเรียบร้อย')
    return true
  }

  async function approve(requestId: string, note?: string) {
    const { error } = await supabase
      .from('Request')
      .update({ status_id: 3, approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq('id', requestId)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return false }
    await logAction(requestId, 3, 'approved', note)
    toast.success('อนุมัติเรียบร้อย')
    return true
  }

  async function reject(requestId: string, reason: string) {
    const { error } = await supabase
      .from('Request')
      .update({ status_id: 6, rejected_by: user?.id, rejected_at: new Date().toISOString(), reason_reject: reason })
      .eq('id', requestId)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return false }
    await logAction(requestId, 6, 'rejected', reason)
    toast.warning('Reject เรียบร้อย')
    return true
  }

  async function postpone(requestId: string, data: { date: string; time: string; reason: string }) {
    const { error } = await supabase
      .from('Request')
      .update({
        status_id: 5,
        postponed_by: user?.id,
        postponed_at: new Date().toISOString(),
        postpone_date: data.date,
        postpone_time: data.time,
        reason_postpone: data.reason,
      })
      .eq('id', requestId)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return false }
    await logAction(requestId, 5, 'postponed', data.reason, {
      postpone_date: data.date,
      postpone_time: data.time,
    })
    toast.success('เลื่อนวันเรียบร้อย')
    return true
  }

  async function confirmOrder(requestId: string, note?: string, volumeActual?: number) {
    const { error } = await supabase
      .from('Request')
      .update({
        status_id: 4,
        confirmed_by: user?.id,
        confirmed_at: new Date().toISOString(),
        ...(volumeActual != null && !Number.isNaN(volumeActual) ? { volume_actual: volumeActual } : {}),
      })
      .eq('id', requestId)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return false }
    await logAction(requestId, 4, 'order_confirmed', note)
    toast.success('สั่งเทคอนกรีตแล้ว')
    return true
  }

  async function complete(
    requestId: string,
    data: {
      volume_confirm: number
      volume_actual?: number
      strength?: number
      after_image?: string
      eslip_url?: string
      checksheet_url?: string
      note?: string
    }
  ) {
    const patch: Record<string, unknown> = {
      status_id: 8,
      confirmed_by: user?.id,
      confirmed_at: new Date().toISOString(),
      volume_confirm: data.volume_confirm,
    }
    if (data.volume_actual !== undefined) patch.volume_actual = data.volume_actual
    if (data.strength !== undefined) patch.strength = data.strength
    if (data.after_image !== undefined) patch.after_image = data.after_image
    if (data.eslip_url !== undefined) patch.eslip_url = data.eslip_url
    if (data.checksheet_url !== undefined) patch.checksheet_url = data.checksheet_url

    const { error } = await supabase.from('Request').update(patch).eq('id', requestId)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return false }
    await logAction(requestId, 8, 'completed', data.note)
    toast.success('Confirm เรียบร้อย — ดำเนินการสำเร็จ')
    return true
  }

  async function cancel(requestId: string, reason: string) {
    const { error } = await supabase
      .from('Request')
      .update({ status_id: 7, cancelled_by: user?.id, cancelled_at: new Date().toISOString(), reason_cancel: reason })
      .eq('id', requestId)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return false }
    await logAction(requestId, 7, 'cancelled', reason)
    toast.warning('ยกเลิกเรียบร้อย')
    return true
  }

  async function reApprove(requestId: string, note?: string) {
    const { error } = await supabase
      .from('Request')
      .update({ status_id: 3, approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq('id', requestId)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return false }
    await logAction(requestId, 3, 're_approved', note)
    toast.success('อนุมัติสั่งเทใหม่เรียบร้อย')
    return true
  }

  return { inspect, approve, reject, postpone, confirmOrder, complete, cancel, reApprove }
}
