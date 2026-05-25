export interface ResizableTableColumnConfig {
  id: string
  /** ความกว้างเริ่มต้น (px) */
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
  /** ค่าเริ่มต้น true — ปิดสำหรับคอลัมน์ Actions */
  resizable?: boolean
}

const STORAGE_PREFIX = 'pour-table-widths:'

export const DEFAULT_COL_MIN = 72
export const DEFAULT_COL_MAX = 640

export function resizableTableStorageKey(tableId: string): string {
  return `${STORAGE_PREFIX}${tableId}`
}

export function loadResizableTableWidths(
  tableId: string,
  columns: ResizableTableColumnConfig[],
): Record<string, number> {
  const base = Object.fromEntries(columns.map((c) => [c.id, c.defaultWidth]))
  if (typeof window === 'undefined') return base
  try {
    const raw = localStorage.getItem(resizableTableStorageKey(tableId))
    if (!raw) return base
    const parsed = JSON.parse(raw) as Record<string, unknown>
    for (const col of columns) {
      const v = parsed[col.id]
      if (typeof v === 'number' && Number.isFinite(v)) {
        base[col.id] = clampWidth(v, col)
      }
    }
  } catch {
    /* ignore */
  }
  return base
}

export function saveResizableTableWidths(tableId: string, widths: Record<string, number>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(resizableTableStorageKey(tableId), JSON.stringify(widths))
  } catch {
    /* ignore */
  }
}

export function clampWidth(px: number, col: ResizableTableColumnConfig): number {
  const min = col.minWidth ?? DEFAULT_COL_MIN
  const max = col.maxWidth ?? DEFAULT_COL_MAX
  return Math.min(max, Math.max(min, Math.round(px)))
}
