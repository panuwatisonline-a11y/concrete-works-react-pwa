import { useEffect, useRef, useState } from 'react'

/** เพิ่ม renderLimit อัตโนมัติเมื่อ sentinel เข้า viewport — ลดการกดปุ่ม "แสดงเพิ่ม" ซ้ำๆ */
export function useInfiniteRenderLimit(
  totalCount: number,
  initial: number,
  step: number,
  resetKey: string,
) {
  const [renderLimit, setRenderLimit] = useState(initial)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setRenderLimit(initial)
  }, [initial, resetKey])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || renderLimit >= totalCount) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        setRenderLimit((n) => Math.min(n + step, totalCount))
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [renderLimit, totalCount, step])

  const hiddenCount = Math.max(0, totalCount - renderLimit)

  return { renderLimit, setRenderLimit, sentinelRef, hiddenCount }
}
