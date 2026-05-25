import { ensureBookedRequestLog } from '@/lib/requestLogService'
import { insertJobIdFromAuth } from '@/lib/jobScopeQueries'
import {
  collectRequestImageUrls,
  deleteReplacedRequestImages,
  deleteStoredImages,
  REQUEST_IMAGE_FIELDS,
  type RequestImageRow,
} from '@/lib/requestImageCleanup'
import { supabase } from '@/lib/supabase'
import type { OfflineMutation } from '@/lib/offline/types'

const REQUEST_IMAGE_SELECT = REQUEST_IMAGE_FIELDS.join(', ')

async function fetchRequestImages(requestId: string): Promise<RequestImageRow | null> {
  const { data, error } = await supabase
    .from('Request')
    .select(REQUEST_IMAGE_SELECT)
    .eq('id', requestId)
    .maybeSingle()
  if (error || !data) return null
  return data as RequestImageRow
}

function patchTouchesImageFields(patch: Record<string, unknown>): boolean {
  return REQUEST_IMAGE_FIELDS.some((f) => f in patch)
}

export type MutationResult =
  | { ok: true; requestId?: string }
  | { ok: false; message: string }

async function logAction(
  requestId: string,
  statusId: number,
  action: string,
  userId: string | undefined,
  note?: string,
  extra?: Record<string, unknown>,
): Promise<MutationResult> {
  const { data: reqRow } = await supabase.from('Request').select('job_id').eq('id', requestId).maybeSingle()
  const jobId = (reqRow?.job_id as number | null | undefined) ?? insertJobIdFromAuth()
  const { error } = await supabase.from('Request_Log').insert({
    request_id: requestId,
    status_id: statusId,
    action,
    action_by: userId,
    note: note ?? null,
    job_id: jobId,
    ...extra,
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function runInspectMutation(
  requestId: string,
  userId: string | undefined,
  payload: Record<string, unknown>,
): Promise<MutationResult> {
  const patch: Record<string, unknown> = {
    status_id: 2,
    inspected_by: userId,
    inspected_at: new Date().toISOString(),
  }
  const corrections = payload.corrections as Record<string, unknown> | undefined
  const oldRow = corrections?.before_image !== undefined
    ? await fetchRequestImages(requestId)
    : null
  if (corrections) Object.assign(patch, corrections)

  const { error } = await supabase.from('Request').update(patch).eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  if (oldRow && corrections?.before_image !== undefined) {
    deleteReplacedRequestImages(oldRow, { ...oldRow, ...corrections }, ['before_image'])
  }
  const log = await logAction(requestId, 2, 'inspected', userId, payload.note as string | undefined)
  return log
}

export async function runApproveMutation(
  requestId: string,
  userId: string | undefined,
  payload: Record<string, unknown>,
  action = 'approved',
): Promise<MutationResult> {
  const { error } = await supabase
    .from('Request')
    .update({ status_id: 3, approved_by: userId, approved_at: new Date().toISOString() })
    .eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  return logAction(requestId, 3, action, userId, payload.note as string | undefined)
}

export async function runRejectMutation(
  requestId: string,
  userId: string | undefined,
  payload: Record<string, unknown>,
): Promise<MutationResult> {
  const { error } = await supabase
    .from('Request')
    .update({
      status_id: 6,
      rejected_by: userId,
      rejected_at: new Date().toISOString(),
      reason_reject: String(payload.reason ?? ''),
    })
    .eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  return logAction(requestId, 6, 'rejected', userId, String(payload.reason ?? ''))
}

export async function runPostponeMutation(
  requestId: string,
  userId: string | undefined,
  payload: Record<string, unknown>,
): Promise<MutationResult> {
  const { error } = await supabase
    .from('Request')
    .update({
      status_id: 5,
      postponed_by: userId,
      postponed_at: new Date().toISOString(),
      postpone_date: payload.date,
      postpone_time: payload.time,
      reason_postpone: payload.reason,
    })
    .eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  return logAction(requestId, 5, 'postponed', userId, String(payload.reason ?? ''), {
    postpone_date: payload.date,
    postpone_time: payload.time,
  })
}

export async function runConfirmOrderMutation(
  requestId: string,
  userId: string | undefined,
  payload: Record<string, unknown>,
): Promise<MutationResult> {
  const volumeActual = payload.volumeActual
  const { error } = await supabase
    .from('Request')
    .update({
      status_id: 4,
      confirmed_by: userId,
      confirmed_at: new Date().toISOString(),
      ...(volumeActual != null && !Number.isNaN(Number(volumeActual))
        ? { volume_actual: Number(volumeActual) }
        : {}),
    })
    .eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  return logAction(requestId, 4, 'order_confirmed', userId, payload.note as string | undefined)
}

export async function runCompleteMutation(
  requestId: string,
  userId: string | undefined,
  payload: Record<string, unknown>,
): Promise<MutationResult> {
  const patch: Record<string, unknown> = {
    status_id: 8,
    confirmed_by: userId,
    confirmed_at: new Date().toISOString(),
    volume_confirm: payload.volume_confirm,
  }
  const imageKeys = ['after_image', 'eslip_url', 'checksheet_url'] as const
  const touchesImages = imageKeys.some((k) => payload[k] !== undefined)
  const oldRow = touchesImages ? await fetchRequestImages(requestId) : null

  for (const k of ['volume_actual', 'strength', ...imageKeys] as const) {
    if (payload[k] !== undefined) patch[k] = payload[k]
  }
  const { error } = await supabase.from('Request').update(patch).eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  if (oldRow) {
    deleteReplacedRequestImages(oldRow, { ...oldRow, ...patch }, [...imageKeys])
  }
  return logAction(requestId, 8, 'completed', userId, payload.note as string | undefined)
}

export async function runCancelMutation(
  requestId: string,
  userId: string | undefined,
  payload: Record<string, unknown>,
): Promise<MutationResult> {
  const oldRow = await fetchRequestImages(requestId)
  const urlsToDelete = collectRequestImageUrls(oldRow ?? undefined)

  const { error } = await supabase
    .from('Request')
    .update({
      status_id: 7,
      cancelled_by: userId,
      cancelled_at: new Date().toISOString(),
      reason_cancel: String(payload.reason ?? ''),
      before_image: null,
      after_image: null,
      eslip_url: null,
      checksheet_url: null,
    })
    .eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  deleteStoredImages(urlsToDelete)
  return logAction(requestId, 7, 'cancelled', userId, String(payload.reason ?? ''))
}

export async function runPatchImageMutation(
  requestId: string,
  field: 'before_image' | 'eslip_url',
  url: string,
): Promise<MutationResult> {
  const oldRow = await fetchRequestImages(requestId)
  const { error } = await supabase.from('Request').update({ [field]: url }).eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  if (oldRow) {
    deleteReplacedRequestImages(oldRow, { ...oldRow, [field]: url }, [field])
  }
  return { ok: true }
}

export async function runCreateRequestMutation(
  userId: string,
  payload: Record<string, unknown>,
): Promise<MutationResult & { requestId?: string }> {
  const row = payload.row as Record<string, unknown>
  const requestId = String(payload.requestId ?? row.id ?? '')
  const { data, error } = await supabase
    .from('Request')
    .insert({ ...row, id: requestId, booked_by: row.booked_by ?? userId })
    .select('id')
    .single()
  if (error || !data) return { ok: false, message: error?.message ?? 'insert failed' }
  const id = data.id as string
  const logErr = await ensureBookedRequestLog(id, userId)
  if (logErr.error) return { ok: false, message: logErr.error }
  return { ok: true, requestId: id as string }
}

export async function runUpdateRequestMutation(
  requestId: string,
  payload: Record<string, unknown>,
): Promise<MutationResult> {
  const patch = payload.patch as Record<string, unknown>
  const oldRow = patchTouchesImageFields(patch) ? await fetchRequestImages(requestId) : null
  const { error } = await supabase.from('Request').update(patch).eq('id', requestId)
  if (error) return { ok: false, message: error.message }
  if (oldRow) {
    deleteReplacedRequestImages(oldRow, { ...oldRow, ...patch })
  }
  return { ok: true }
}

export async function executeOfflineMutation(m: OfflineMutation): Promise<MutationResult> {
  const uid = m.userId
  switch (m.kind) {
    case 'workflow_inspect':
      return runInspectMutation(m.requestId, uid, m.payload)
    case 'workflow_approve':
      return runApproveMutation(m.requestId, uid, m.payload)
    case 'workflow_re_approve':
      return runApproveMutation(m.requestId, uid, m.payload, 're_approved')
    case 'workflow_reject':
      return runRejectMutation(m.requestId, uid, m.payload)
    case 'workflow_postpone':
      return runPostponeMutation(m.requestId, uid, m.payload)
    case 'workflow_confirm_order':
      return runConfirmOrderMutation(m.requestId, uid, m.payload)
    case 'workflow_complete':
      return runCompleteMutation(m.requestId, uid, m.payload)
    case 'workflow_cancel':
      return runCancelMutation(m.requestId, uid, m.payload)
    case 'patch_before_image':
      return runPatchImageMutation(m.requestId, 'before_image', String(m.payload.url ?? ''))
    case 'patch_eslip_url':
      return runPatchImageMutation(m.requestId, 'eslip_url', String(m.payload.url ?? ''))
    case 'create_request':
      return runCreateRequestMutation(uid, m.payload)
    case 'update_request':
      return runUpdateRequestMutation(m.requestId, m.payload)
    default:
      return { ok: false, message: 'Unknown mutation' }
  }
}
