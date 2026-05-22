type Listener = (active: boolean) => void

let active = false
const listeners = new Set<Listener>()

export function setPageTransitionActive(next: boolean) {
  if (active === next) return
  active = next
  for (const fn of listeners) fn(next)
}

export function isPageTransitionActive(): boolean {
  return active
}

export function subscribePageTransitionActive(fn: Listener): () => void {
  fn(active)
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function afterPageTransition(cb: () => void): () => void {
  if (!active) {
    cb()
    return () => {}
  }
  let done = false
  const unsub = subscribePageTransitionActive((isActive) => {
    if (!isActive && !done) {
      done = true
      unsub()
      cb()
    }
  })
  return unsub
}
