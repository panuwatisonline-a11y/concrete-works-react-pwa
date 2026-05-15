import { useEffect } from 'react'
import { reloadMasterData } from '@/lib/reloadMasterData'
import { useMasterDataStore } from '@/stores/masterDataStore'

export function useMasterDataInit() {
  const isLoaded = useMasterDataStore((s) => s.isLoaded)

  useEffect(() => {
    if (isLoaded) return
    void reloadMasterData()
  }, [isLoaded])
}
