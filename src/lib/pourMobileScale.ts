import {
  POUR_MOBILE_FONT_FACTOR,
  POUR_MOBILE_REF_HEIGHT,
  POUR_MOBILE_REF_WIDTH,
  POUR_MOBILE_TYPE_REF_WIDTH,
  POUR_MOBILE_UI_FACTOR,
} from '@/lib/pourScaleRefs'

export {
  POUR_MOBILE_REF_WIDTH,
  POUR_MOBILE_REF_HEIGHT,
  POUR_MOBILE_TYPE_REF_WIDTH,
  POUR_MOBILE_UI_FACTOR,
  POUR_MOBILE_FONT_FACTOR,
}

export function pourMobileVw(px: number): string {
  return `calc(${px} * 100vw / ${POUR_MOBILE_REF_WIDTH} * ${POUR_MOBILE_UI_FACTOR})`
}

export function pourMobileVh(px: number): string {
  return `calc(${px} * 100vh / ${POUR_MOBILE_REF_HEIGHT} * ${POUR_MOBILE_UI_FACTOR})`
}

/** ตัวอักษร Figma มือถือ — vw ที่เฟรม 390 */
export function pourMobileFontVw(px: number): string {
  return `round(nearest, calc(${px} * 100vw / ${POUR_MOBILE_TYPE_REF_WIDTH} * ${POUR_MOBILE_FONT_FACTOR}), 1px)`
}

/** คลาสร่วม — ใช้ภายใต้ `.pour-mobile-fix-scale` (มือถือแนวตั้ง) */
export const pourMobileUi = {
  root: 'pour-mobile-fix-scale',
  mainScroll: 'pour-mobile-main-scroll',
} as const
