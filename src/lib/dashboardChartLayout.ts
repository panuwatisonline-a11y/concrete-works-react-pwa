/** ความสูงกราฟแท่งแนวตั้ง — ให้แต่ละแถวมีพื้นที่พอ */
export function dashboardBarChartHeight(rowCount: number, min = 160, rowPx = 48): number {
  if (rowCount <= 0) return min
  return Math.max(min, rowCount * rowPx)
}

/** ความกว้างแกน Y ตามความยาวป้ายชื่อ */
export function dashboardYAxisWidth(labels: string[], opts?: { min?: number; max?: number; charPx?: number }): number {
  const min = opts?.min ?? 80
  const max = opts?.max ?? 200
  const charPx = opts?.charPx ?? 6.5
  const longest = labels.reduce((m, s) => Math.max(m, String(s).length), 0)
  return Math.min(max, Math.max(min, Math.ceil(longest * charPx) + 20))
}

export function truncateAxisLabel(label: string, maxLen = 22): string {
  const s = String(label).trim()
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 1)}…`
}

/** margin ขวาเผื่อป้าย ค่า | % หลังแท่ง */
export function dashboardBarChartMargin(yAxisWidth: number, withValueLabels = true) {
  return {
    top: 10,
    right: withValueLabels ? 92 : 20,
    left: 8,
    bottom: 8,
    /** สำหรับอ้างอิงเมื่อปรับ layout */
    yAxisWidth,
  }
}
