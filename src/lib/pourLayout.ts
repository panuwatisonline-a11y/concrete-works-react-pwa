import { useEffect, useState } from 'react'

/**
 * โหมด desktop — แนวนอนและกว้างพอ (สอดคล้องกับ Tailwind variant `pour-desktop:`)
 * แนวตั้ง = มือถือ, แนวนอน ≥768px = PC layout
 */
export const POUR_DESKTOP_MEDIA = '(orientation: landscape) and (min-width: 768px)'

export function isPourDesktopViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(POUR_DESKTOP_MEDIA).matches
}

export function subscribePourDesktop(onChange: (isDesktop: boolean) => void): () => void {
  const mq = window.matchMedia(POUR_DESKTOP_MEDIA)
  const sync = () => onChange(mq.matches)
  sync()
  mq.addEventListener('change', sync)
  return () => mq.removeEventListener('change', sync)
}

export function usePourDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(isPourDesktopViewport)
  useEffect(() => subscribePourDesktop(setIsDesktop), [])
  return isDesktop
}
