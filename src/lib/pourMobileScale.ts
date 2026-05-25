import { POUR_MOBILE_REF_HEIGHT, POUR_MOBILE_REF_WIDTH } from '@/lib/pourScaleRefs'

export { POUR_MOBILE_REF_WIDTH, POUR_MOBILE_REF_HEIGHT }

/** 0.8 = ลด 20% จาก canvas 1200×2608 */
export const POUR_MOBILE_UI_FACTOR = 0.8

export function pourMobileVw(px: number): string {
  return `calc(${px} * 100vw / ${POUR_MOBILE_REF_WIDTH} * ${POUR_MOBILE_UI_FACTOR})`
}

export function pourMobileVh(px: number): string {
  return `calc(${px} * 100vh / ${POUR_MOBILE_REF_HEIGHT} * ${POUR_MOBILE_UI_FACTOR})`
}

/** คลาสร่วม — ใช้ภายใต้ `.pour-mobile-fix-scale` (มือถือแนวตั้ง) */
export const pourMobileUi = {
  root: 'pour-mobile-fix-scale',
  mainScroll: 'pour-mobile-main-scroll',
} as const
