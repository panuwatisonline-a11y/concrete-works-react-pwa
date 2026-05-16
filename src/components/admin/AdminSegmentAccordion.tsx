import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="space-y-2">
      {groups.map((g) => {
        const isOpen = openId === g.id
        return (
          <div
            key={g.id}
            className="overflow-hidden rounded-xl border border-[color:var(--pour-surface-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <button
              type="button"
              onClick={() => toggle(g.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#f5f6f8]/80"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-[#6b7280] transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="truncate font-semibold text-[#111827]">{g.label}</span>
                <span className="shrink-0 rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-medium tabular-nums text-[#6b7280]">
                  {g.count} รายการ
                </span>
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-[color:var(--pour-surface-border)]/80 px-3 pb-4 pt-2 pour-desktop:px-4 pour-desktop:pt-3">{g.children}</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
