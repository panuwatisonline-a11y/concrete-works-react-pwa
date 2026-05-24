/** เลื่อนหน้าจอไปฟิลด์แรกที่มีข้อความ error (ใช้หลัง react-hook-form trigger ไม่ผ่าน) */
export function scrollToFirstInvalidFormField(
  fieldOrder: readonly string[],
  root?: ParentNode | null,
): string | null {
  const scope = root ?? document
  for (const name of fieldOrder) {
    const wrap = scope.querySelector(`[data-form-field="${CSS.escape(name)}"]`)
    if (!wrap) continue
    const err = wrap.querySelector('[data-field-error]')
    const message = err?.textContent?.trim()
    if (!message) continue

    wrap.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const focusable = wrap.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([readonly]), textarea, [role="combobox"]',
    )
    focusable?.focus({ preventScroll: true })
    return message
  }
  return null
}
