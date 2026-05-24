import type { RequestFilter } from '@/types/app.types'
import type { RequestLogWithProfile, RequestWithRelations } from '@/types/app.types'
import type { QueryJobScope } from '@/lib/jobScope'
import { idbGet, idbGetAll, idbPut, STORES } from '@/lib/offline/db'
import type { CachedRequestDetail, ListSnapshot } from '@/lib/offline/types'

type CachedRequestRow = RequestWithRelations & { savedAt: string }

function jobScopeCacheKey(jobScope: QueryJobScope): string {
  if (jobScope === 'all') return 'all'
  if (jobScope == null) return ''
  return String(jobScope)
}

export function buildListCacheKey(opts: {
  scopeMine: boolean
  userId: string | undefined
  jobScope: QueryJobScope
  filterKey: string
  page: number
  search: string
}): string {
  return [
    opts.scopeMine ? 'mine' : 'all',
    opts.userId ?? '',
    jobScopeCacheKey(opts.jobScope),
    opts.filterKey,
    String(opts.page),
    opts.search.trim().toLowerCase(),
  ].join('|')
}

export async function cacheRequestRow(request: RequestWithRelations): Promise<void> {
  await idbPut<CachedRequestRow>(STORES.requests, {
    ...request,
    savedAt: new Date().toISOString(),
  })
}

export async function cacheRequestRows(requests: RequestWithRelations[]): Promise<void> {
  await Promise.all(requests.map((r) => cacheRequestRow(r)))
}

export async function saveListSnapshot(
  cacheKey: string,
  requests: RequestWithRelations[],
  total: number,
  statusCounts?: Record<number, number>,
): Promise<void> {
  const snapshot: ListSnapshot = {
    cacheKey,
    requests,
    total,
    statusCounts,
    savedAt: new Date().toISOString(),
  }
  await idbPut(STORES.listSnapshots, snapshot)
}

export async function getListSnapshot(cacheKey: string): Promise<ListSnapshot | undefined> {
  return idbGet<ListSnapshot>(STORES.listSnapshots, cacheKey)
}

export async function getCachedRequest(id: string): Promise<RequestWithRelations | undefined> {
  const row = await idbGet<CachedRequestRow>(STORES.requests, id)
  if (!row) return undefined
  const { savedAt: _s, ...req } = row
  return req
}

export async function getAllCachedRequests(): Promise<RequestWithRelations[]> {
  const rows = await idbGetAll<CachedRequestRow>(STORES.requests)
  return rows.map(({ savedAt: _s, ...r }) => r)
}

export async function cacheRequestDetail(
  requestId: string,
  request: RequestWithRelations,
  logs: RequestLogWithProfile[],
  cstAgesSaved: number[],
): Promise<void> {
  const detail: CachedRequestDetail & { requestId: string } = {
    requestId,
    request,
    logs,
    cstAgesSaved,
    savedAt: new Date().toISOString(),
  }
  await idbPut(STORES.details, detail)
  await cacheRequestRow(request)
}

export async function getCachedRequestDetail(
  requestId: string,
): Promise<CachedRequestDetail | undefined> {
  return idbGet<CachedRequestDetail & { requestId: string }>(STORES.details, requestId)
}

function matchesJobScope(r: RequestWithRelations, jobScope: QueryJobScope): boolean {
  if (jobScope === null || jobScope === 'all') return true
  return r.job_id === jobScope
}

function matchesFilter(r: RequestWithRelations, filter: RequestFilter): boolean {
  if (filter.status_ids.length > 0 && !filter.status_ids.includes(r.status_id)) return false
  if (filter.casting_date_from && (r.casting_date ?? '') < filter.casting_date_from) return false
  if (filter.casting_date_to && (r.casting_date ?? '') > filter.casting_date_to) return false
  if (filter.client_id != null && r.client_id !== filter.client_id) return false
  if (filter.location_id != null && r.location_id !== filter.location_id) return false
  if (filter.concrete_work_id != null && r.concrete_work_id !== filter.concrete_work_id) return false
  return true
}

function matchesSearch(r: RequestWithRelations, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const parts = [
    r.id,
    r.structure_no,
    r.remarks,
    (r.client as { client_name?: string } | null)?.client_name,
    (r.location as { full_location?: string; location1?: string } | null)?.full_location,
    (r.location as { location1?: string } | null)?.location1,
    (r.structure as { structure_name?: string } | null)?.structure_name,
    (r.mixcode as { mixcode?: string } | null)?.mixcode,
    (r.booked_by_profile as { fname?: string; lname?: string; employee_id?: string } | null)?.fname,
    (r.booked_by_profile as { fname?: string; lname?: string; employee_id?: string } | null)?.lname,
    (r.booked_by_profile as { employee_id?: string } | null)?.employee_id,
  ]
  return parts.some((p) => (p ?? '').toString().toLowerCase().includes(needle))
}

export function filterCachedRequests(opts: {
  requests: RequestWithRelations[]
  filter: RequestFilter
  search: string
  scopeMine: boolean
  userId: string | undefined
  jobScope: QueryJobScope
  page: number
  pageSize: number
}): { requests: RequestWithRelations[]; total: number } {
  let list = opts.requests.filter(
    (r) => matchesJobScope(r, opts.jobScope) && matchesFilter(r, opts.filter) && matchesSearch(r, opts.search),
  )
  if (opts.scopeMine && opts.userId) {
    list = list.filter((r) => r.booked_by === opts.userId)
  }
  list = [...list].sort((a, b) => {
    const da = a.casting_date ?? ''
    const db = b.casting_date ?? ''
    if (da !== db) return db.localeCompare(da)
    return (a.booked_at ?? '').localeCompare(b.booked_at ?? '')
  })
  const total = list.length
  const start = opts.page * opts.pageSize
  return { requests: list.slice(start, start + opts.pageSize), total }
}

export function countCachedByStatus(
  requests: RequestWithRelations[],
  scopeMine: boolean,
  userId: string | undefined,
  jobScope: QueryJobScope,
): Record<number, number> {
  let list = requests.filter((r) => matchesJobScope(r, jobScope))
  if (scopeMine && userId) {
    list = list.filter((r) => r.booked_by === userId)
  }
  const map: Record<number, number> = {}
  for (const r of list) {
    map[r.status_id] = (map[r.status_id] ?? 0) + 1
  }
  return map
}
