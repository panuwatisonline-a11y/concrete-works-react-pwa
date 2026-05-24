import type { ConcreteWork, MixedCode, Structure } from '@/types/app.types'
import { formatMixcodeStrengthLabel } from '@/lib/mixcodeStrengthOptions'
import { parseStructureListTokens, structureListsIntersect } from '@/lib/structureListTokens'

export type DwgStrengthParts = {
  strength: number
  strengthType: string
}

function normalizeStrengthType(t: string | null | undefined): string {
  return (t?.trim() ?? '').toLowerCase()
}

/** แยกค่า Select (strength|strength_type) */
export function parseDwgStrengthOption(value: string | null | undefined): DwgStrengthParts | null {
  const raw = value?.trim()
  if (!raw) return null
  const pipe = raw.indexOf('|')
  const strengthPart = pipe >= 0 ? raw.slice(0, pipe) : raw
  const strengthType = pipe >= 0 ? raw.slice(pipe + 1).trim() : ''
  const strength = parseFloat(strengthPart)
  if (Number.isNaN(strength)) return null
  return { strength, strengthType }
}

/** Mixcode ใช้ได้เมื่อ strength ≥ DWG และ strength_type ตรงกัน (ถ้ามีระบุ) */
export function mixcodeMeetsDwgMinimum(m: MixedCode, dwg: DwgStrengthParts): boolean {
  if (m.strength == null || Number.isNaN(m.strength)) return false
  const mType = normalizeStrengthType(m.strength_type)
  const dType = normalizeStrengthType(dwg.strengthType)
  if (dType !== '' && mType !== dType) return false
  return m.strength >= dwg.strength
}

/** กรอง Mixcode ตามงานคอนกรีต + โครงสร้าง */
export function filterMixcodesByConcreteWorkAndStructure(opts: {
  mixcodes: MixedCode[]
  concreteWork: ConcreteWork | undefined
  structure: Structure | undefined
}): MixedCode[] {
  const { mixcodes, concreteWork, structure } = opts
  if (!concreteWork) return mixcodes
  return mixcodes.filter((m) => {
    if (!structureListsIntersect(m.structure_list, concreteWork.structure_list)) return false
    if (!structure) return true
    const allowed = parseStructureListTokens(m.structure_list)
    if (allowed.length === 0) return true
    return allowed.includes(structure.structure_name)
  })
}

/** กรอง Mixcode ที่ strength ≥ DWG (over-spec ใช้ได้) */
export function filterMixcodesForBooking(
  mixcodes: MixedCode[],
  dwgStrengthOption: string | null | undefined,
): MixedCode[] {
  const dwg = parseDwgStrengthOption(dwgStrengthOption)
  if (!dwg) return []
  return mixcodes
    .filter((m) => mixcodeMeetsDwgMinimum(m, dwg))
    .sort((a, b) => (a.strength ?? 0) - (b.strength ?? 0) || a.mixcode.localeCompare(b.mixcode, 'th'))
}

export function validateMixcodeForBooking(
  mixcodeId: string,
  mixcodes: MixedCode[],
  dwgStrengthOption: string,
): string | null {
  const dwg = parseDwgStrengthOption(dwgStrengthOption)
  if (!dwg) return 'กรุณาเลือก DWG Strength'
  const m = mixcodes.find((x) => String(x.id) === mixcodeId)
  if (!m) return 'กรุณาเลือก Mixcode'
  if (!mixcodeMeetsDwgMinimum(m, dwg)) return 'Mixcode ต่ำกว่าค่ากำลังอัดตามแบบ'
  return null
}

export function getMixcodeOverDwgHint(
  selected: MixedCode | undefined,
  dwgStrengthOption: string | null | undefined,
): string | null {
  const dwg = parseDwgStrengthOption(dwgStrengthOption)
  if (!dwg || selected?.strength == null || Number.isNaN(selected.strength)) return null
  if (selected.strength <= dwg.strength) return null
  const dwgLabel =
    formatMixcodeStrengthLabel({ strength: dwg.strength, strength_type: dwg.strengthType || null }) ??
    String(dwg.strength)
  const selLabel = formatMixcodeStrengthLabel(selected) ?? String(selected.strength)
  return `Mixcode ${selLabel} สูงกว่าแบบ ${dwgLabel} — ใช้ได้`
}

export function mixcodePickerEmptyMessage(opts: {
  dwgStrengthOption: string | null | undefined
  scopeMixcodes: MixedCode[]
  pickerMixcodes: MixedCode[]
  scopeEmptyMessage?: string
}): string | undefined {
  const { dwgStrengthOption, scopeMixcodes, pickerMixcodes, scopeEmptyMessage } = opts
  if (!parseDwgStrengthOption(dwgStrengthOption)) {
    return 'กรุณาเลือก DWG Strength ก่อน'
  }
  if (scopeMixcodes.length === 0) {
    return scopeEmptyMessage ?? 'ไม่มี Mixcode ที่ตรงกับงานคอนกรีตและโครงสร้างที่เลือก'
  }
  if (pickerMixcodes.length === 0) {
    return 'ไม่มี Mixcode ที่ strength ≥ ค่าตามแบบที่เลือก'
  }
  return undefined
}
