import { useCallback } from 'react'
import { useDataSyncOnTables } from '@/hooks/useDataSyncOnTables'

/** รีเฟรชข้อมูลเมื่อตารางที่ระบุเปลี่ยนจาก Realtime */
export function useDataSyncRefetch(
  tables: readonly string[],
  load: (opts?: { background?: boolean }) => void | Promise<void>,
): void {
  const onSync = useCallback(() => {
    void load({ background: true })
  }, [load])

  useDataSyncOnTables(tables, onSync)
}
