import { useEffect } from 'react'
import { initTouchPressEnhancer } from '@/lib/touchPressEnhancer'

export function TouchPressEnhancer() {
  useEffect(() => initTouchPressEnhancer(), [])
  return null
}
