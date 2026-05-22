/** Native-style stack transitions (mobile). Depth tiers — higher = deeper in stack. */

/** Match CSS stack animation duration (ms). */
export const PAGE_TRANSITION_MS = 420

export type PageTransitionMode = 'push' | 'pop' | 'fade'

export function getRouteDepth(pathname: string): number {
  const p = pathname.replace(/\/$/, '') || '/'

  if (p.startsWith('/requests')) {
    if (p === '/requests') return 100
    if (p === '/requests/new' || p === '/requests/booking-summary') return 200
    if (/^\/requests\/[^/]+\/edit$/.test(p)) return 300
    if (/^\/requests\/[^/]+$/.test(p)) return 200
    return 100
  }

  if (p === '/profile') return 400
  if (p.startsWith('/cst')) return p === '/cst' ? 500 : 600
  if (p.startsWith('/admin')) return p === '/admin' ? 700 : 800
  if (p.startsWith('/preview')) return 900

  return 0
}

export function resolvePageTransition(
  fromPath: string,
  toPath: string,
  navigationType: 'POP' | 'PUSH' | 'REPLACE',
  useNativeStack: boolean,
): PageTransitionMode {
  if (!useNativeStack) return 'fade'

  if (navigationType === 'POP') return 'pop'

  const fromD = getRouteDepth(fromPath)
  const toD = getRouteDepth(toPath)
  if (toD > fromD) return 'push'
  if (toD < fromD) return 'pop'

  return 'fade'
}

export function exitClassForMode(mode: PageTransitionMode): string {
  if (mode === 'push') return 'pour-page-push-out'
  if (mode === 'pop') return 'pour-page-pop-out'
  return 'pour-page-fade-out'
}

export function enterClassForMode(mode: PageTransitionMode): string {
  if (mode === 'push') return 'pour-page-push-in'
  if (mode === 'pop') return 'pour-page-pop-in'
  return 'pour-page-fade-in'
}
