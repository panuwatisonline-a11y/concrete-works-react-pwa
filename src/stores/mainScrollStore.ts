/** Scroll position of PullToRefreshMain inner scroller — restore list without changing layout. */

type ScrollSnapshot = { top: number }

const snapshots = new Map<string, ScrollSnapshot>()
let scrollEl: HTMLElement | null = null

export function registerMainScrollEl(el: HTMLElement | null) {
  scrollEl = el
}

export function saveMainScroll(key: string) {
  if (!scrollEl || !key) return
  snapshots.set(key, { top: scrollEl.scrollTop })
}

export function restoreMainScroll(key: string): boolean {
  if (!scrollEl || !key) return false
  const snap = snapshots.get(key)
  if (!snap) return false
  scrollEl.scrollTop = snap.top
  return true
}

export function scrollMainToTop() {
  if (!scrollEl) return
  scrollEl.scrollTop = 0
}

/** Only the request list feed uses scroll memory (same URL the user left). */
export function getRequestListScrollKey(pathname: string, search: string): string | null {
  if (pathname !== '/requests') return null
  return `/requests${search}`
}
