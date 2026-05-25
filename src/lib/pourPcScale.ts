import { useCallback, useEffect, useState } from 'react'
import { POUR_PC_REF_HEIGHT, POUR_PC_REF_WIDTH } from '@/lib/pourScaleRefs'

export { POUR_PC_REF_WIDTH, POUR_PC_REF_HEIGHT }

/** ตัวคูณสเกล UI บน desktop (0.8 = ลด 20% จาก canvas อ้างอิง) */
export const POUR_PC_UI_FACTOR = 0.8

/** ความกว้างจาก px ที่ ref → vw */
export function pourPcVw(px: number): string {
  return `calc(${px} * 100vw / ${POUR_PC_REF_WIDTH} * ${POUR_PC_UI_FACTOR})`
}

/** ความสูงจาก px ที่ ref → vh */
export function pourPcVh(px: number): string {
  return `calc(${px} * 100vh / ${POUR_PC_REF_HEIGHT} * ${POUR_PC_UI_FACTOR})`
}

/** ขนาดตัวอักษร — สเกลตามความกว้างจอ (fix scale แนวนอน) */
export function pourPcFontVw(px: number): string {
  return pourPcVw(px)
}

export function pourPcScaleFactors(viewportW: number, viewportH: number) {
  return {
    w: viewportW / POUR_PC_REF_WIDTH,
    h: viewportH / POUR_PC_REF_HEIGHT,
  }
}

/** แปลง px ที่ออกแบบไว้ → ค่าจริงบนจอปัจจุบัน (Recharts ต้องการ number) */
export function pourPcPxW(px: number, viewportW: number): number {
  return px * (viewportW / POUR_PC_REF_WIDTH) * POUR_PC_UI_FACTOR
}

export function pourPcPxH(px: number, viewportH: number): number {
  return px * (viewportH / POUR_PC_REF_HEIGHT) * POUR_PC_UI_FACTOR
}

/** คลาสร่วม — ต้องอยู่ภายใต้ `.pour-pc-fix-scale` บน pour-desktop */
export const pourPcUi = {
  root: 'pour-pc-fix-scale',
  table: 'pour-desktop:min-w-0 pour-desktop:pour-pc-app-table',
  tableResizable: 'pour-table-resizable',
  tableWrap: 'pour-desktop:overflow-hidden',
  tableShellNoScroll: 'pour-desktop:overflow-x-hidden',
  topbar: 'pour-desktop:pour-pc-topbar',
  mainScroll: 'pour-desktop:pour-pc-main-scroll',
  sidebarNav: 'pour-pc-sidebar-nav',
  /** ไม่บีบด้วย ellipsis / max-width:0 (คู่กับคลาสความกว้างด้านล่าง) */
  noShrink: 'pour-pc-no-shrink',
  /** # / Item */
  colNarrow: 'pour-pc-no-shrink pour-pc-col-narrow',
  /** วันที่ + ปุ่มพิมพ์ (CST) */
  colLead: 'pour-pc-no-shrink pour-pc-col-lead',
  /** คอลัมน์ CST +N / ผลเฉลี่ย */
  colAge: 'pour-pc-no-shrink pour-pc-col-age',
  /** Accept/No, toggle */
  colToggle: 'pour-pc-no-shrink pour-pc-col-toggle',
  /** แถบ Usage % */
  colChart: 'pour-pc-no-shrink pour-pc-col-chart',
  /** ปุ่ม Actions 1–2 ปุ่ม */
  colActions: 'pour-pc-no-shrink pour-pc-col-actions',
  /** หลายปุ่ม (Users) */
  colActionsWide: 'pour-pc-no-shrink pour-pc-col-actions pour-pc-col-actions--wide',
  /** ข้อความในตาราง — บรรทัดเดียว (คู่กับ TableClampText) */
  clampText: 'pour-pc-clamp-text',
  /** @deprecated ใช้ clampText — คอลัมน์ข้อมูลบีบบรรทัดเดียวจาก CSS ตารางแล้ว */
  tdNowrap: 'pour-pc-td-nowrap',
} as const

export function usePourPcScale() {
  const read = useCallback(() => {
    if (typeof window === 'undefined') {
      return { w: POUR_PC_REF_WIDTH, h: POUR_PC_REF_HEIGHT }
    }
    return { w: window.innerWidth, h: window.innerHeight }
  }, [])

  const [size, setSize] = useState(read)

  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [read])

  const { w, h } = size
  const factors = pourPcScaleFactors(w, h)

  return {
    vw: pourPcVw,
    vh: pourPcVh,
    fontVw: pourPcFontVw,
    pxW: (px: number) => pourPcPxW(px, w),
    pxH: (px: number) => pourPcPxH(px, h),
    scaleW: factors.w,
    scaleH: factors.h,
    viewportW: w,
    viewportH: h,
  }
}
