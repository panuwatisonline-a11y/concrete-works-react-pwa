import type { MixedCode } from '@/types/app.types'

export const DWG_STRENGTH_FIELD_LABEL = 'DWG. Strength (ค่ากำลังอัดตามแบบ)'
export const DWG_STRENGTH_SELECT_PLACEHOLDER = `เลือก ${DWG_STRENGTH_FIELD_LABEL}`
export const DWG_STRENGTH_REQUIRED_MESSAGE = `กรุณาเลือก ${DWG_STRENGTH_FIELD_LABEL}`

export type MixcodeStrengthOption = {
  /** คีย์ไม่ซ้ำสำหรับ Select (strength|strength_type) */
  value: string
  /** แสดงในรายการ เช่น 300 ksc. */
  label: string
  strength: number
}

export function formatMixcodeStrengthLabel(
  m: Pick<MixedCode, 'strength' | 'strength_type'>,
): string | null {
  if (m.strength == null || Number.isNaN(m.strength)) return null
  const t = m.strength_type?.trim()
  return t ? `${m.strength} ${t}` : String(m.strength)
}

function strengthOptionValue(strength: number, strengthType: string | null | undefined): string {
  return `${strength}|${strengthType?.trim() ?? ''}`
}

/** รายการ Strength ไม่ซ้ำจากตาราง Mixed Code เรียงตามค่าตัวเลข */
export function listMixcodeStrengthOptions(mixcodes: MixedCode[]): MixcodeStrengthOption[] {
  const seen = new Set<string>()
  const out: MixcodeStrengthOption[] = []
  for (const m of mixcodes) {
    const label = formatMixcodeStrengthLabel(m)
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push({
      value: strengthOptionValue(m.strength!, m.strength_type),
      label,
      strength: m.strength!,
    })
  }
  out.sort((a, b) => a.strength - b.strength || a.label.localeCompare(b.label, 'th', { sensitivity: 'base' }))
  return out
}

export function parseMixcodeStrengthOptionValue(value: string | undefined | null): number | null {
  const raw = value?.trim()
  if (!raw) return null
  const n = parseFloat(raw.split('|')[0] ?? '')
  return Number.isNaN(n) ? null : n
}

/** แมปค่า strength ที่บันทึกในคำขอ → ค่า Select */
export function mixcodeStrengthOptionValueForStoredStrength(
  strength: number | null | undefined,
  mixcodes: MixedCode[],
): string {
  if (strength == null || Number.isNaN(strength)) return ''
  const opts = listMixcodeStrengthOptions(mixcodes)
  const match = opts.find((o) => o.strength === strength)
  return match?.value ?? strengthOptionValue(strength, '')
}

export function mixcodeStrengthLabelForOptionValue(
  value: string | undefined | null,
  mixcodes: MixedCode[],
): string | null {
  const raw = value?.trim()
  if (!raw) return null
  const opt = listMixcodeStrengthOptions(mixcodes).find((o) => o.value === raw)
  if (opt) return opt.label
  const n = parseMixcodeStrengthOptionValue(raw)
  return n != null ? String(n) : null
}
