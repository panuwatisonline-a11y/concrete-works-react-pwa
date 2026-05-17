/** iOS / iPadOS Safari — native date/time inputs overflow containers in modals */
export function isIosWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

const THAI_DATE = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  calendar: 'buddhist',
})

export function formatTemporalInputDisplay(type: string, value: string): string {
  const v = value?.trim() ?? ''
  if (!v) return ''

  if (type === 'date') {
    const [y, m, d] = v.split('-').map((n) => parseInt(n, 10))
    if (y > 0 && m > 0 && d > 0) {
      return THAI_DATE.format(new Date(y, m - 1, d))
    }
    return v
  }

  if (type === 'time') {
    const [h, min, sec] = v.split(':')
    if (h == null) return v
    const hh = h.padStart(2, '0')
    const mm = (min ?? '00').padStart(2, '0')
    return sec != null && sec !== '' ? `${hh}:${mm}:${sec.padStart(2, '0')}` : `${hh}:${mm}`
  }

  if (type === 'datetime-local') {
    const [datePart, timePart] = v.split('T')
    const dateStr = datePart ? formatTemporalInputDisplay('date', datePart) : ''
    const timeStr = timePart ? formatTemporalInputDisplay('time', timePart) : ''
    return [dateStr, timeStr].filter(Boolean).join(' ')
  }

  return v
}

export function temporalInputPlaceholder(type: string, explicit?: string): string {
  if (explicit?.trim()) return explicit
  switch (type) {
    case 'time':
      return 'เลือกเวลา'
    case 'datetime-local':
      return 'เลือกวันที่และเวลา'
    case 'month':
      return 'เลือกเดือน'
    case 'week':
      return 'เลือกสัปดาห์'
    default:
      return 'เลือกวันที่'
  }
}

export function openNativeTemporalPicker(el: HTMLInputElement | null): void {
  if (!el || el.disabled) return
  try {
    el.showPicker()
  } catch {
    el.focus({ preventScroll: true })
    el.click()
  }
}
