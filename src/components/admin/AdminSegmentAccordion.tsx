import { useState, type ReactNode } from 'react'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { AppIcon } from '@/components/icons/AppIcon'
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
  /** ปิดกรอบ/padding ชั้นใน เพื่อให้เนื้อหาแสดงเต็มพื้นที่ */
  unframedBody?: boolean
  /** โหมดเรียบ: ไม่ใช้การ์ดครอบแต่ละกลุ่ม */
  flat?: boolean
}

/**
 * แสดงหลายตาราง segment แบบกลุ่มย่อ/ขยาย — เปิดได้ทีละกลุ่ม และเรนเดอร์เนื้อหาเฉพาะกลุ่มที่เปิด
 * เหมาะเมื่อแต่ละตารางมีแถวจำนวนมาก
 */
export function AdminSegmentAccordion({
  groups,
  defaultOpenId,
  unframedBody = true,
  flat = true,
}: AdminSegmentAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(() => {
    if (defaultOpenId !== undefined) return defaultOpenId
    return groups[0]?.id ?? null
  })

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className={cn(flat ? 'space-y-1' : 'space-y-3')}>
      {groups.map((g) => {
        const isOpen = openId === g.id
        return (
          <div
            key={g.id}
            className={cn(
              flat
                ? 'overflow-visible rounded-none border-0 bg-transparent'
                : frame.section,
              flat && 'border-b border-[color:var(--glass-border-subtle)] last:border-b-0',
            )}
          >
            <button
              type="button"
              onClick={() => toggle(g.id)}
              aria-expanded={isOpen}
              className={cn(
                'flex w-full items-center justify-between gap-3 text-left transition',
                flat
                  ? cn(
                      'rounded-2xl px-3 py-3.5 shadow-[var(--glass-shadow-sm)]',
                      isOpen
                        ? 'bg-[color:var(--glass-bg)]'
                        : 'bg-[color:var(--glass-bg-muted)] hover:bg-[color:var(--glass-bg)]',
                    )
                  : 'px-4 py-3 hover:bg-[color:var(--pour-nav-hover-bg)]/70 sm:px-5',
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <AppIcon
                  icon={ExpandMore}
                  size="md"
                  className={cn('text-pour-muted transition-transform duration-200', isOpen && 'rotate-180')}
                />
                <span className={cn(frame.sectionTitle, 'truncate')}>{g.label}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums sm:text-sm',
                    flat
                      ? 'border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] text-[color:var(--pour-ink-1)]'
                      : 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]',
                  )}
                >
                  {g.count} รายการ
                </span>
              </span>
            </button>
            {isOpen ? (
              <div
                className={cn(
                  unframedBody ? 'min-w-0' : frame.sectionBody,
                  flat && unframedBody && 'px-0 pb-3 pt-2',
                )}
              >
                {g.children}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
