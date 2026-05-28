import { APP_VERSION } from '@/lib/appVersion'
import { refreshToLatestVersion } from '@/register-pwa'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function AppVersionLabel({ className }: { className?: string }) {
  const [reloading, setReloading] = useState(false)

  async function handleRefresh() {
    if (reloading) return
    setReloading(true)
    try {
      await refreshToLatestVersion()
    } finally {
      // Safety: if reload did not happen for any reason, unlock the button.
      setReloading(false)
    }
  }

  return (
    <div className={cn('mt-2 text-center', className)}>
      <p
        className="text-pour-2xs tabular-nums leading-none text-[color:var(--pour-ink-3)]"
        aria-label={`เวอร์ชันแอป ${APP_VERSION}`}
      >
        v{APP_VERSION}
      </p>
      <button
        type="button"
        className="mt-1 text-pour-2xs text-[color:var(--pour-accent)] hover:underline disabled:opacity-60"
        onClick={() => void handleRefresh()}
        disabled={reloading}
      >
        {reloading ? 'กำลังอัปเดต…' : 'โหลดเวอร์ชันล่าสุด'}
      </button>
    </div>
  )
}
