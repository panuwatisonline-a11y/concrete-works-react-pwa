import type { ReactNode } from 'react'
import { buildRequestSummaryFields } from '@/lib/requestSummaryFields'
import { modalForm } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

/** รายละเอียดคำขอ — rhythm เดียวกับฟิลด์ฟอร์มใน modal */
export function RequestModalSummary({
  request,
  className,
}: {
  request: RequestWithRelations
  className?: string
}) {
  const fields = buildRequestSummaryFields(request)

  return (
    <dl className={cn(modalForm.stack, className)}>
      {fields.map((row) => (
        <div key={row.id} className={modalForm.field}>
          <dt className={modalForm.label}>{row.label}</dt>
          <dd
            className={cn(
              modalForm.value,
              row.id === 'id' && 'font-mono',
              row.id === 'remarks' && 'whitespace-pre-wrap',
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** คั่นรายละเอียดกับฟอร์ม — ระยะด้านบนมาจาก gap ของ parent stack เท่านั้น */
export function RequestModalFormSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-t border-[color:var(--glass-border-subtle)]', className)}>
      <div className={modalForm.stack}>{children}</div>
    </section>
  )
}
