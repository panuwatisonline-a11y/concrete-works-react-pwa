const PRESSED_CLASS = 'pour-pressed'

const PRESSABLE_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  '[role="button"]:not([aria-disabled="true"])',
  '.pour-interactive',
  '.pour-card-lift',
].join(', ')

const IGNORE_SELECTOR = 'input, textarea, select, [data-pour-no-press], [contenteditable="true"]'

function findPressable(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  if (target.closest(IGNORE_SELECTOR)) return null

  const navItem = target.closest('.pour-nav-item')
  if (navItem instanceof HTMLElement) return navItem

  const el = target.closest(PRESSABLE_SELECTOR)
  if (!(el instanceof HTMLElement)) return null

  if (el.matches('button:not(:disabled), [role="button"]:not([aria-disabled="true"])')) {
    return el
  }

  const card = el.closest('.pour-card-lift')
  if (card instanceof HTMLElement) {
    if (el === card || el.closest('a[href]')) return card
  }

  return el
}

function clearPressed() {
  for (const el of document.querySelectorAll(`.${PRESSED_CLASS}`)) {
    el.classList.remove(PRESSED_CLASS)
  }
}

function setPressed(el: HTMLElement) {
  clearPressed()
  el.classList.add(PRESSED_CLASS)
}

const MOVE_CANCEL_PX = 10

/** Instant press feedback on touch (iOS :active is often delayed or invisible). */
export function initTouchPressEnhancer(): () => void {
  let startX = 0
  let startY = 0
  let tracking = false

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    const el = findPressable(e.target)
    if (!el) return
    setPressed(el)
    startX = e.clientX
    startY = e.clientY
    tracking = true
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!tracking) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      tracking = false
      clearPressed()
    }
  }

  const onClear = () => {
    tracking = false
    clearPressed()
  }

  document.addEventListener('pointerdown', onPointerDown, { passive: true })
  document.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('pointerup', onClear, { passive: true })
  document.addEventListener('pointercancel', onClear, { passive: true })
  window.addEventListener('blur', onClear)

  return () => {
    document.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onClear)
    document.removeEventListener('pointercancel', onClear)
    window.removeEventListener('blur', onClear)
    clearPressed()
  }
}
