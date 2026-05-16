import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { frame } from '@/lib/requestUi'

export interface AdminSegmentGroup {
  id: string
  label: string
  count: number
  children: ReactNode
}

interface AdminSegmentAccordionProps {
  groups: AdminSegmentGroup[]
  /** กลุ่มที่เปิดตอนโหลดครั้งแรก (ถ้าไม่ระบุ จะเปิดกลุ่มแรก) */
  defaultOpenId?: string | null
}

/**
 * แสดงหลายตาราง segment แบบกลุ่มย่อ/ขยาย — เปิดได้ทีละกลุ่ม และเรนเดอร์เนื้อหาเฉพาะกลุ่มที่เปิด
 * เหมาะเมื่อแต่ละตารางมีแถวจำนวนมาก
 */
export function AdminSegmentAccordion({ groups, defaultOpenId }: AdminSegmentAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(() => {
    if (defaultOpenId !== undefined) return defaultOpenId
    return groups[0]?.id ?? null
  })

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isOpen = openId === g.id
        return (
          <div key={g.id} className={frame.section}>
            <button
              type="button"
              onClick={() => toggle(g.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[color:var(--pour-nav-hover-bg)]/70 sm:px-5"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 text-pour-muted transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className={cn(frame.sectionTitle, 'truncate')}>{g.label}</span>
                <span className="shrink-0 rounded-full bg-[color:var(--pour-accent-muted)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[color:var(--pour-accent)] sm:text-sm">
                  {g.count} รายการ
                </span>
              </span>
            </button>
            {isOpen ? <div className={frame.sectionBody}>{g.children}</div> : null}
          </div>
        )
      })}
    </div>
  )
}
