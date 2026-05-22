import { usePourDesktop } from '@/lib/pourLayout'
import { DesktopOutlet } from '@/components/motion/DesktopOutlet'
import { MobileAnimatedOutlet } from '@/components/motion/MobileAnimatedOutlet'

export function AnimatedOutlet({ className }: { className?: string }) {
  const isDesktop = usePourDesktop()
  return isDesktop ? (
    <DesktopOutlet className={className} />
  ) : (
    <MobileAnimatedOutlet className={className} />
  )
}
