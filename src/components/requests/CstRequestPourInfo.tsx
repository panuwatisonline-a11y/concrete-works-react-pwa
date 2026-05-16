import { activeCastingDateIso } from '@/lib/activeCastingDate'
import { rq } from '@/lib/requestUi'
import { cn, formatDate, formatVolumeCuM, shortId } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

function pourVolumeLabel(request: RequestWithRelations): string {
  if (request.volume_confirm != null) return formatVolumeCuM(request.volume_confirm)
  if (request.volume_actual != null) return formatVolumeCuM(request.volume_actual)
  return formatVolumeCuM(request.volume_request)
}

export function mixCodePourLine(request: RequestWithRelations): string | null {
  const mix = request.mixcode as {
    mixcode: string
    supplier: string | null
    strength: number | null
    slump: string | null
    strength_type: string | null
  } | null
  if (!mix) return null
  const parts = [
    mix.mixcode?.trim(),
    mix.supplier?.trim(),
    mix.strength != null
      ? `${mix.strength}${mix.strength_type ? ` ${mix.strength_type}` : ''}`
      : null,
    mix.slump?.trim(),
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

export function buildCstPourInfoRows(request: RequestWithRelations): { label: string; value: string }[] {
  const activeCasting = activeCastingDateIso(request)
  const castingLabel = activeCasting ? formatDate(`${activeCasting}T12:00:00`) : '—'
  const postponeNote =
    request.postpone_date?.trim() && request.casting_date?.trim()
      ? `เลื่อนจาก ${formatDate(`${request.casting_date.trim()}T12:00:00`)}`
      : null

  const structure = (request.structure as { structure_name: string } | null)?.structure_name?.trim()
  const structureNo = request.structure_no?.trim()
  const structureLine =
    structure || structureNo
      ? [structure, structureNo ? `No. ${structureNo}` : null].filter(Boolean).join(' · ')
      : null

  const location =
    (request.location as { full_location: string | null; location1?: string } | null)?.full_location ??
    (request.location as { location1?: string } | null)?.location1 ??
    null

  const client = (request.client as { client_name: string } | null)?.client_name?.trim()

  const rows: { label: string; value: string }[] = [
    { label: 'วันเท', value: postponeNote ? `${castingLabel} (${postponeNote})` : castingLabel },
    {
      label: 'Concrete Work',
      value: (request.concrete_work as { concrete_work: string } | null)?.concrete_work?.trim() ?? '—',
    },
    { label: 'Structure', value: structureLine ?? '—' },
    { label: 'Location', value: location ?? '—' },
    { label: 'Mix Code', value: mixCodePourLine(request) ?? '—' },
    { label: 'Volume', value: pourVolumeLabel(request) },
  ]

  if (client) rows.splice(1, 0, { label: 'Client', value: client })
  if (request.sample_qty != null) {
    rows.push({ label: 'ตัวอย่าง', value: `${request.sample_qty} ก้อน` })
  }

  return rows
}

type CstRequestPourInfoProps = {
  request: RequestWithRelations
  className?: string
  /** ซ่อนหัวข้อย่อยเมื่ออยู่ใน Dialog ที่มี title แล้ว */
  embedded?: boolean
}

export function CstRequestPourInfo({ request, className, embedded }: CstRequestPourInfoProps) {
  const rows = buildCstPourInfoRows(request)

  return (
    <section
      className={cn(
        !embedded && rq.cardMuted,
        !embedded && 'rounded-[12px] border border-[color:var(--glass-border-subtle)]',
        'space-y-2.5 p-3.5 sm:p-4',
        className,
      )}
      aria-label="ข้อมูลการเท"
    >
      {!embedded ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--pour-ink-2)]">
            ข้อมูลการเท
          </p>
          <span className="font-mono text-[10px] font-semibold text-pour-muted">{shortId(request.id)}</span>
        </div>
      ) : null}
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-pour-muted">{label}</dt>
            <dd className="mt-0.5 text-sm font-medium leading-snug text-[color:var(--pour-ink-0)]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
