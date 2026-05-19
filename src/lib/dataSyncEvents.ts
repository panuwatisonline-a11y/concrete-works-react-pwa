import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { reloadMasterData } from '@/lib/reloadMasterData'

/** แจ้งหน้าที่ mount อยู่ว่าข้อมูลจาก Supabase เปลี่ยน */
export const DATA_SYNC_EVENT = 'pour:data-sync'

export type DataSyncDetail = {
  table: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  /** รหัสคำขอ (Request / Request_Log / CST.ref) */
  requestId?: string
  /** primary key ของแถวที่เปลี่ยน */
  recordId?: string
}

const MASTER_DATA_TABLES = new Set([
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
])

const REQUEST_TABLES = new Set(['Request', 'Request_Log'])
const CST_TABLES = new Set(['CST'])

function rowRequestId(table: string, row: Record<string, unknown> | undefined): string | undefined {
  if (!row) return undefined
  if (table === 'Request' && typeof row.id === 'string') return row.id
  if (typeof row.request_id === 'string') return row.request_id
  if (table === 'CST' && typeof row.ref === 'string') return row.ref
  return undefined
}

function rowRecordId(row: Record<string, unknown> | undefined): string | undefined {
  if (!row) return undefined
  const id = row.id
  return typeof id === 'string' ? id : undefined
}

export function dispatchDataSync(detail: DataSyncDetail): void {
  window.dispatchEvent(new CustomEvent<DataSyncDetail>(DATA_SYNC_EVENT, { detail }))
}

/** เรียกหลังได้ postgres_changes จาก Supabase Realtime */
export function handleRealtimePostgresChange(payload: {
  table: string
  eventType: string
  new: Record<string, unknown>
  old: Record<string, unknown>
}): void {
  const table = payload.table
  const eventType = payload.eventType as DataSyncDetail['eventType']
  const row = payload.new?.id != null || Object.keys(payload.new).length > 0 ? payload.new : payload.old
  const requestId = rowRequestId(table, row)
  const recordId = rowRecordId(row)

  const detail: DataSyncDetail = { table, eventType, requestId, recordId }
  dispatchDataSync(detail)

  if (REQUEST_TABLES.has(table)) {
    void notifyRequestListChanged()
  }
  if (MASTER_DATA_TABLES.has(table)) {
    void reloadMasterData()
  }
}

export function dispatchVisibilityResync(): void {
  dispatchDataSync({ table: '*', eventType: '*' })
  void notifyRequestListChanged()
  void reloadMasterData()
}

export function isMasterDataTable(table: string): boolean {
  return MASTER_DATA_TABLES.has(table)
}

export function isRequestTable(table: string): boolean {
  return REQUEST_TABLES.has(table)
}

export function isCstTable(table: string): boolean {
  return CST_TABLES.has(table)
}

export function isProfilesTable(table: string): boolean {
  return table === 'profiles'
}
