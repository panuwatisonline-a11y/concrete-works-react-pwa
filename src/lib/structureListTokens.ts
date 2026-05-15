/** ค่าที่บันทึกจาก StructureListMultiSelect (Mixcode / Concrete Works) */
export const STRUCTURE_LIST_JOIN = ', '

/** แยกชื่อโครงสร้างจาก `structure_list` ให้สอดคล้องกับที่บันทึกใน DB */
export function parseStructureListTokens(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  return raw.split(/[,;/|]/).map((s) => s.trim()).filter(Boolean)
}

/**
 * สอง `structure_list` มี token ร่วมอย่างน้อยหนึ่งรายการ (intersect ไม่ว่าง)
 * ถ้าฝั่งใดเป็นรายการว่างถือว่าไม่จำกัด — intersect กับอีกฝั่งถือว่าผ่าน
 */
export function structureListsIntersect(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const ta = parseStructureListTokens(a)
  const tb = parseStructureListTokens(b)
  if (ta.length === 0 || tb.length === 0) return true
  const sa = new Set(ta)
  return tb.some((t) => sa.has(t))
}

/**
 * โครงสร้างชื่อ `structureName` ใช้คู่กับงานคอนกรีตได้ และมี Mixcode อย่างน้อยหนึ่งตัวที่รองรับจริง
 * (intersect CW กับ Mixcode แล้ว Mixcode ว่างรายการหรือมีชื่อนี้ใน list)
 */
export function structureHasCompatibleMixcode(
  structureName: string,
  concreteWork: { structure_list: string | null } | null | undefined,
  mixcodes: { structure_list: string | null }[],
): boolean {
  if (!concreteWork) return true
  if (!mixcodes.length) {
    const Tw = parseStructureListTokens(concreteWork.structure_list)
    return Tw.length === 0 || Tw.includes(structureName)
  }
  const Tw = parseStructureListTokens(concreteWork.structure_list)
  if (Tw.length > 0 && !Tw.includes(structureName)) return false

  for (const m of mixcodes) {
    if (!structureListsIntersect(m.structure_list, concreteWork.structure_list)) continue
    const Tm = parseStructureListTokens(m.structure_list)
    if (Tm.length === 0) return true
    if (Tm.includes(structureName)) return true
  }
  return false
}

/**
 * รวม token ทั้งหมดจาก `structure_list` ของ Mixcode (เฉพาะรายการที่ไม่ว่าง)
 */
export function mixcodeStructureListTokenUnion(mixcodes: { structure_list: string | null }[]): string[] {
  const union = new Set<string>()
  for (const m of mixcodes) {
    const raw = m.structure_list?.trim()
    if (!raw) continue
    for (const t of parseStructureListTokens(m.structure_list)) {
      union.add(t)
    }
  }
  return [...union].sort((a, b) => a.localeCompare(b, 'th'))
}

/**
 * ชื่อโครงสร้างจาก master ที่ให้เลือกใน Concrete Work ได้ — ต้องปรากฏใน union ของ Mixcode เท่านั้น
 */
export function structureNamesSelectableFromMixcodes(
  masterNames: string[],
  mixcodes: { structure_list: string | null }[],
): string[] {
  const list = mixcodeStructureListTokenUnion(mixcodes)
  if (list.length === 0) return []
  const u = new Set(list)
  return masterNames.filter((n) => u.has(n))
}
