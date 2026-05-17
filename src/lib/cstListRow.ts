import { activeCastingDateIso } from '@/lib/activeCastingDate'
import { formatDate, formatVolumeNumber } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

export type CstListMix = {
  mixcode: string
  supplier: string | null
  strength: number | null
  strength_type: string | null
}

export type CstListRowFields = {
  castingDate: string
  concrete: string | null
  structure: string | null
  location: string | null
  structureNo: string | null
  mix: CstListMix | null
  volume: string
}

function volumeLine(r: RequestWithRelations): string {
  if (r.volume_confirm != null) return formatVolumeNumber(r.volume_confirm)
  if (r.volume_actual != null) return formatVolumeNumber(r.volume_actual)
  if (r.volume_request != null) return formatVolumeNumber(r.volume_request)
  return '-'
}

export function parseCstListMix(request: RequestWithRelations): CstListMix | null {
  const raw = request.mixcode as {
    mixcode?: string | null
    supplier?: string | null
    strength?: number | null
    strength_type?: string | null
  } | null
  if (!raw) return null
  const mixcode = raw.mixcode?.trim() ?? ''
  const supplier = raw.supplier?.trim() || null
  if (!mixcode && !supplier) return null
  return {
    mixcode,
    supplier,
    strength: raw.strength ?? null,
    strength_type: raw.strength_type?.trim() || null,
  }
}

export function getCstListRowFields(r: RequestWithRelations): CstListRowFields {
  const structure = (r.structure as { structure_name: string } | null)?.structure_name?.trim() || null
  const structureNo = r.structure_no?.trim() || null
  const location =
    (r.location as { full_location: string | null; location1: string } | null)?.full_location ??
    (r.location as { location1: string } | null)?.location1 ??
    null
  const concrete = (r.concrete_work as { concrete_work: string } | null)?.concrete_work ?? null
  const active = activeCastingDateIso(r)
  const date = active ? formatDate(active) : formatDate(r.casting_date)
  const castingDate = date && date !== '-' ? date : '-'

  return {
    castingDate,
    concrete,
    structure,
    location,
    structureNo,
    mix: parseCstListMix(r),
    volume: volumeLine(r),
  }
}

export function cstMixStrengthText(mix: CstListMix | null): string | null {
  if (!mix || mix.strength == null || Number.isNaN(mix.strength)) return null
  const unit = mix.strength_type?.trim()
  return unit ? `${mix.strength} ${unit}` : String(mix.strength)
}

export function cstMixCodeLabel(mix: CstListMix | null): string {
  if (!mix?.mixcode?.trim()) {
    const supplier = mix?.supplier?.trim()
    const strength = cstMixStrengthText(mix)
    if (supplier && strength) return `${supplier} · ${strength}`
    return supplier || strength || '-'
  }
  const parts = [mix.mixcode.trim(), mix.supplier, cstMixStrengthText(mix)].filter(Boolean)
  return parts.length ? parts.join(' · ') : '-'
}

export function cstMixCodeLabelForCard(mix: CstListMix | null): string | null {
  const label = cstMixCodeLabel(mix)
  return label === '-' ? null : label
}
