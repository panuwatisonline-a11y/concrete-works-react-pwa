/**
 * Canvas อ้างอิง fix-scale (Figma frame) — ออกแบบ UI ตามขนาดนี้ แล้ว map ด้วย vw/vh
 * Mobile: 1200×2608
 * Desktop (pour-desktop): 1440×900 — สเกล 1:1 ที่ viewport = frame (Figma laptop)
 */

/** Spacing / layout artboard (ค่า px ใน CSS ÷ 1200 × 100vw) */
export const POUR_MOBILE_REF_WIDTH = 1200
export const POUR_MOBILE_REF_HEIGHT = 2608

/** Typography Figma frame 390×844 */
export const POUR_MOBILE_TYPE_REF_WIDTH = 390

/** สเกล spacing บนมือถือ — 1 = พอดีที่จอ ~390 (49→16px inset) */
export const POUR_MOBILE_UI_FACTOR = 1

/** คูณ font-size มือถือ (1 = ตรง Figma) */
export const POUR_MOBILE_FONT_FACTOR = 1

/** ขนาดตัวอักษร Figma มือถือ (px @ 390) — ดู pour-mobile-type.css */
export const POUR_MOBILE_TYPE_PX = {
  '2xs': 10,
  xs: 11,
  sm: 12,
  base: 14,
  md: 13,
  lg: 15,
  xl: 17,
  title: 17,
  '2xl': 18,
  '3xl': 20,
  display: 22,
  html: 15,
} as const

export const POUR_PC_REF_WIDTH = 1440
export const POUR_PC_REF_HEIGHT = 900

/** สเกล layout/spacing บน PC — 1 = ตรง px ใน Figma ที่ความกว้าง 1440 */
export const POUR_PC_UI_FACTOR = 1

/** คูณเฉพาะ font-size ในตาราง/คอนโทรล (1 = ตรง Figma) */
export const POUR_FONT_UI_FACTOR = 1

/** ขนาดตัวอักษร Figma (px ที่เฟรม 1440×900) — ดู src/styles/pour-pc-type.css */
export const POUR_PC_TYPE_PX = {
  '2xs': 9,
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 16,
  '2xl': 18,
  /** หัวหน้า Orders / dashboard บน wireframe PC */
  title: 20,
  '3xl': 21,
  display: 24,
  html: 14,
} as const
