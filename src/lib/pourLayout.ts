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

/** Pull-to-refresh — touch phones (รวมแนวนอน) หรือจอแคบ ไม่ผูกกับ pour-desktop layout */
const PULL_REFRESH_QUERIES = ['(max-width: 767px)', '(hover: none) and (pointer: coarse)'] as const

export function isPullRefreshEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return PULL_REFRESH_QUERIES.some((q) => window.matchMedia(q).matches)
}

export function subscribePullRefreshEnabled(onChange: (enabled: boolean) => void): () => void {
  const mqs = PULL_REFRESH_QUERIES.map((q) => window.matchMedia(q))
  const sync = () => onChange(mqs.some((mq) => mq.matches))
  sync()
  for (const mq of mqs) mq.addEventListener('change', sync)
  return () => {
    for (const mq of mqs) mq.removeEventListener('change', sync)
  }
}

function isScrollableY(el: HTMLElement): boolean {
  if (el.scrollHeight <= el.clientHeight + 1) return false
  const oy = getComputedStyle(el).overflowY
  return oy === 'auto' || oy === 'scroll' || oy === 'overlay'
}

/** หา element ที่เลื่อนจริง — ภายใน main boundary */
export function resolveScrollRoot(from: EventTarget | null, boundary: HTMLElement): HTMLElement {
  let el: HTMLElement | null = null
  if (from instanceof HTMLElement) el = from
  else if (from instanceof Node) el = from.parentElement
  while (el && el !== boundary) {
    if (isScrollableY(el)) return el
    el = el.parentElement
  }
  return boundary
}

export function isScrollAtTop(el: HTMLElement): boolean {
  return el.scrollTop <= 1
}
