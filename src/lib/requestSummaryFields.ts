import type { ReactNode } from 'react'
import { remarksForDisplay } from '@/lib/nonSystemBooking'
import { formatDate, formatTime, formatVolumeCuM, shortId } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

export type RequestSummaryField = {
  id: string
  label: string
  value: ReactNode
  stacked?: boolean
}

/** ลำดับรายละเอียด — สอดคล้องหน้า detail / list card */
export function buildRequestSummaryFields(request: RequestWithRelations): RequestSummaryField[] {
  const mx = request.mixcode as {
    mixcode: string
    strength: number | null
    slump: string | null
    strength_type: string | null
  } | null

  const castingDatePart = request.casting_date ? formatDate(request.casting_date) : null
  const requestTimePart = request.request_time ? formatTime(request.request_time) : null
  const castingDateTime =
    castingDatePart && castingDatePart !== '-' && requestTimePart && requestTimePart !== '-'
      ? `${castingDatePart} | ${requestTimePart}`
      : castingDatePart && castingDatePart !== '-'
        ? castingDatePart
        : requestTimePart && requestTimePart !== '-'
          ? requestTimePart
          : '—'

  const structureName = (request.structure as { structure_name: string } | null)?.structure_name?.trim() || null
  const loc = request.location as { full_location: string | null; location1: string } | null
  const locationDisplay = loc?.full_location ?? loc?.location1 ?? null

  const strengthSlump = mx
    ? [mx.strength != null ? `${mx.strength} ${mx.strength_type ?? ''}`.trim() : null, mx.slump]
        .filter(Boolean)
        .join(' · ') || null
    : null

  const fields: RequestSummaryField[] = [
    { id: 'id', label: 'รหัสคำขอ', value: shortId(request.id) },
    { id: 'casting', label: 'Casting date', value: castingDateTime },
    {
      id: 'client',
      label: 'User Group',
      value: (request.client as { client_name: string } | null)?.client_name ?? '—',
    },
    { id: 'abc', label: 'ABC', value: (request.abc_code as { full_abc: string | null } | null)?.full_abc ?? '—' },
    { id: 'wbs', label: 'WBS', value: (request.wbs_code as { full_wbs: string | null } | null)?.full_wbs ?? '—' },
    {
      id: 'cw',
      label: 'Concrete Works',
      value: (request.concrete_work as { concrete_work: string } | null)?.concrete_work ?? '—',
    },
    { id: 'structure', label: 'Structure', value: structureName ?? '—' },
    { id: 'location', label: 'Location', value: locationDisplay ?? '—', stacked: true },
    { id: 'structure-no', label: 'Structure No.', value: request.structure_no?.trim() || '—' },
    { id: 'mix', label: 'Mix code', value: mx?.mixcode ?? '—' },
    { id: 'strength-slump', label: 'กำลังอัด / Slump', value: strengthSlump ?? '—' },
    { id: 'vol-req', label: 'Request Volume (cu.m)', value: formatVolumeCuM(request.volume_request, '—') },
  ]

  if (request.volume_dwg != null) {
    fields.push({ id: 'vol-dwg', label: 'DWG volume (cu.m)', value: formatVolumeCuM(request.volume_dwg, '—') })
  }
  if (request.volume_actual != null) {
    fields.push({
      id: 'vol-actual',
      label: 'Actual volume (cu.m)',
      value: formatVolumeCuM(request.volume_actual, '—'),
    })
  }
  if (request.sample_qty != null) {
    fields.push({ id: 'sample', label: 'จำนวนตัวอย่าง', value: `${request.sample_qty} ก้อน` })
  }

  fields.push({
    id: 'remarks',
    label: 'หมายเหตุ',
    value: remarksForDisplay(request.remarks) ?? '—',
    stacked: true,
  })

  return fields
}
