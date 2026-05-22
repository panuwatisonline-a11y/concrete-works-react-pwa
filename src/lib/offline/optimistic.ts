import type { OfflineMutation } from '@/lib/offline/types'
import type { RequestWithRelations } from '@/types/app.types'

const now = () => new Date().toISOString()

export function applyOptimisticToRequest(
  request: RequestWithRelations,
  mutation: OfflineMutation,
): RequestWithRelations {
  const p = mutation.payload
  const uid = mutation.userId

  switch (mutation.kind) {
    case 'workflow_inspect':
      return {
        ...request,
        ...fieldPatch(p, [
          'location_id',
          'concrete_work_id',
          'structure_id',
          'structure_no',
          'mixcode_id',
          'volume_request',
          'before_image',
        ]),
        status_id: 2,
        inspected_by: uid,
        inspected_at: now(),
      }
    case 'workflow_approve':
    case 'workflow_re_approve':
      return {
        ...request,
        status_id: 3,
        approved_by: uid,
        approved_at: now(),
      }
    case 'workflow_reject':
      return {
        ...request,
        status_id: 6,
        rejected_by: uid,
        rejected_at: now(),
        reason_reject: String(p.reason ?? ''),
      }
    case 'workflow_postpone':
      return {
        ...request,
        status_id: 5,
        postponed_by: uid,
        postponed_at: now(),
        postpone_date: String(p.date ?? ''),
        postpone_time: String(p.time ?? ''),
        reason_postpone: String(p.reason ?? ''),
      }
    case 'workflow_confirm_order':
      return {
        ...request,
        status_id: 4,
        confirmed_by: uid,
        confirmed_at: now(),
        ...(p.volumeActual != null && !Number.isNaN(Number(p.volumeActual))
          ? { volume_actual: Number(p.volumeActual) }
          : {}),
      }
    case 'workflow_complete':
      return {
        ...request,
        status_id: 8,
        confirmed_by: uid,
        confirmed_at: now(),
        volume_confirm: Number(p.volume_confirm),
        ...(p.volume_actual !== undefined ? { volume_actual: Number(p.volume_actual) } : {}),
        ...(p.strength !== undefined ? { strength: Number(p.strength) } : {}),
        ...(p.after_image !== undefined ? { after_image: String(p.after_image) } : {}),
        ...(p.eslip_url !== undefined ? { eslip_url: String(p.eslip_url) } : {}),
        ...(p.checksheet_url !== undefined ? { checksheet_url: String(p.checksheet_url) } : {}),
      }
    case 'workflow_cancel':
      return {
        ...request,
        status_id: 7,
        cancelled_by: uid,
        cancelled_at: now(),
        reason_cancel: String(p.reason ?? ''),
      }
    case 'patch_before_image':
      return { ...request, before_image: String(p.url ?? '') }
    case 'patch_eslip_url':
      return { ...request, eslip_url: String(p.url ?? '') }
    case 'update_request': {
      const patch = p.patch as Partial<RequestWithRelations> | undefined
      return { ...request, ...(patch ?? {}) } as RequestWithRelations
    }
    case 'create_request': {
      const row = p.row as Partial<RequestWithRelations> | undefined
      return { ...request, ...(row ?? {}) } as RequestWithRelations
    }
    default:
      return request
  }
}

function fieldPatch(
  payload: Record<string, unknown>,
  keys: string[],
): Partial<RequestWithRelations> {
  const out: Record<string, unknown> = {}
  for (const k of keys) {
    if (payload[k] !== undefined) out[k] = payload[k]
  }
  return out as Partial<RequestWithRelations>
}

export async function applyOptimisticToCachedRequest(
  requestId: string,
  mutation: OfflineMutation,
): Promise<void> {
  const { getCachedRequest, cacheRequestRow, getCachedRequestDetail, cacheRequestDetail } =
    await import('@/lib/offline/cache')
  const base = (await getCachedRequest(requestId)) ?? ({
    id: requestId,
    status_id: 1,
  } as RequestWithRelations)
  const next = applyOptimisticToRequest(base, mutation)
  await cacheRequestRow(next)
  const detail = await getCachedRequestDetail(requestId)
  if (detail) {
    await cacheRequestDetail(requestId, next, detail.logs, detail.cstAgesSaved)
  }
}
