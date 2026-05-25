import Notifications from '@mui/icons-material/Notifications'
import NotificationsOff from '@mui/icons-material/NotificationsOff'
import CircularProgress from '@mui/material/CircularProgress'
import { AppIcon } from '@/components/icons/AppIcon'
import { usePushNotification } from '@/hooks/usePushNotification'
import { getPushUnavailableReason, pushUnavailableMessage } from '@/lib/pushNotification'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { rq } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function permissionHint(permission: string): string | null {
  if (permission === 'denied') {
    return 'เบราว์เซอร์บล็อกการแจ้งเตือน — เปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์แล้วลองใหม่'
  }
  if (permission === 'default') {
    return 'กดปุ่มด้านขวาเพื่ออนุญาตและเปิดการแจ้งเตือน'
  }
  return null
}

export function PushNotificationSettings() {
  const unavailable = getPushUnavailableReason()
  const { isSupported, permission, isSubscribed, loading, error, subscribe, unsubscribe } =
    usePushNotification()

  async function handleToggle() {
    if (isSubscribed) {
      const ok = await unsubscribe()
      if (ok) toast.success('ปิดการแจ้งเตือนแล้ว')
      return
    }
    const ok = await subscribe()
    if (ok) {
      toast.success('เปิดการแจ้งเตือนแล้ว', {
        description: 'จะได้รับทุกครั้งที่มีคำขอเปลี่ยนสถานะ — ไม่ต้องการให้กดปิด',
      })
    }
  }

  if (unavailable) {
    return (
      <Card className={rq.card}>
        <CardContent className={cn(rq.cardContent, 'space-y-2')}>
          <p className="font-semibold text-[color:var(--pour-ink-0)]">การแจ้งเตือน Push</p>
          <p className="text-sm text-amber-700 dark:text-amber-300">{pushUnavailableMessage(unavailable)}</p>
        </CardContent>
      </Card>
    )
  }

  const hint = permissionHint(permission)
  const disabled = loading || permission === 'denied' || !isSupported

  return (
    <Card className={rq.card}>
      <CardContent className={cn(rq.cardContent, 'flex items-start gap-4')}>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            isSubscribed
              ? 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
              : 'bg-[color:var(--pour-bg-2)] text-[color:var(--pour-ink-3)]',
          )}
        >
          {isSubscribed ? (
            <AppIcon icon={Notifications} size="md" />
          ) : (
            <AppIcon icon={NotificationsOff} size="md" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold text-[color:var(--pour-ink-0)]">การแจ้งเตือน Push</p>
          <p className="text-sm text-pour-muted">
            {isSubscribed
              ? 'เปิดอยู่ — รับแจ้งทุกครั้งที่คำขอเปลี่ยนสถานะ (ทุกคนที่เปิดไว้)'
              : 'ปิดอยู่ — เปิดเพื่อรับแจ้งเตือนคำขอทุกรายการบนอุปกรณ์นี้'}
          </p>
          {hint ? <p className="text-xs text-pour-muted">{hint}</p> : null}
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </div>

        <Button
          type="button"
          variant={isSubscribed ? 'outline' : 'default'}
          size="sm"
          className="shrink-0 rounded-xl"
          disabled={disabled}
          onClick={() => void handleToggle()}
        >
          {loading ? (
            <CircularProgress size={16} sx={{ flexShrink: 0 }} />
          ) : isSubscribed ? (
            'ปิด'
          ) : (
            'เปิด'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
