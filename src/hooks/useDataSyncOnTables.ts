import { useEffect, useRef } from 'react'
import { DATA_SYNC_EVENT, type DataSyncDetail } from '@/lib/dataSyncEvents'

type SyncHandler = (detail: DataSyncDetail) => void

/**
 * ฟังการเปลี่ยนข้อมูลจาก Realtime / visibility resync
 * @param tables ชื่อตารางที่สนใจ หรือ `'*'` สำหรับทุกตาราง
 */
export function useDataSyncOnTables(tables: readonly string[], onSync: SyncHandler): void {
  const handlerRef = useRef(onSync)
  handlerRef.current = onSync

  const tableKey = tables.join('\0')

  useEffect(() => {
    if (!tables.length) return

    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<DataSyncDetail>).detail
      if (!detail) return
      if (tables.includes('*') || tables.includes(detail.table)) {
        handlerRef.current(detail)
      }
    }

    window.addEventListener(DATA_SYNC_EVENT, onEvent)
    return () => window.removeEventListener(DATA_SYNC_EVENT, onEvent)
  }, [tableKey, tables])
}
