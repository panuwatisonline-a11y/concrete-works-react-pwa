import type { RequestWithRelations } from '@/types/app.types'

export type OfflineMutationKind =
  | 'workflow_inspect'
  | 'workflow_approve'
  | 'workflow_reject'
  | 'workflow_postpone'
  | 'workflow_confirm_order'
  | 'workflow_complete'
  | 'workflow_cancel'
  | 'workflow_re_approve'
  | 'patch_before_image'
  | 'patch_eslip_url'
  | 'create_request'
  | 'update_request'

export type OfflineMutation = {
  id: string
  kind: OfflineMutationKind
  createdAt: string
  userId: string
  requestId: string
  payload: Record<string, unknown>
}

export type ListSnapshot = {
  cacheKey: string
  requests: RequestWithRelations[]
  total: number
  statusCounts?: Record<number, number>
  savedAt: string
}

export type CachedRequestDetail = {
  request: RequestWithRelations
  logs: import('@/types/app.types').RequestLogWithProfile[]
  cstAgesSaved: number[]
  savedAt: string
}
