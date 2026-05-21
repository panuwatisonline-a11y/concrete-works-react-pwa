import { useCallback, useEffect, useState } from 'react'
import { useDataSyncRefetch } from '@/hooks/useDataSyncRefetch'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { LossConcreteDashboard } from '@/components/loss-concrete/LossConcreteDashboard'
import { fetchLossConcreteRecords } from '@/lib/lossConcreteAnalytics'
import { supabase } from '@/lib/supabase'
import { app, theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import type { LossConcreteRecord } from '@/lib/lossConcreteAnalytics'

export function LossConcretePage() {
  const [records, setRecords] = useState<LossConcreteRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (opts?: { background?: boolean }) => {
    if (!opts?.background) setLoading(true)
    try {
      const data = await fetchLossConcreteRecords(supabase)
      setRecords(data)
    } catch (e) {
      console.error('Loss concrete load:', e)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useDataSyncRefetch(['Request', '*'], load)
  usePullToRefreshOnLoad(() => load({ background: true }))

  return (
    <div className={app.pageAdmin}>
      <h1
        className={cn(
          'text-2xl font-bold tracking-tight pour-desktop:text-3xl',
          theme.brandWordmark,
          app.pageAdminTitle,
        )}
      >
        Loss Concrete
      </h1>
      <p className="text-sm text-pour-muted">
        รายการสถานะ Complete ที่มี DWG volume และค่า Loss (volume_loss หรือ Confirm − DWG)
      </p>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]" />
        </div>
      ) : (
        <LossConcreteDashboard records={records} />
      )}
    </div>
  )
}
