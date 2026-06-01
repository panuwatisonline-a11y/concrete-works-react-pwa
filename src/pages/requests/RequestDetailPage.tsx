import { useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { useDataSyncOnTables } from '@/hooks/useDataSyncOnTables'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { toast } from 'sonner'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { cacheRequestDetail, getCachedRequestDetail } from '@/lib/offline/cache'
import { fetchRequestById, fetchRequestLogs } from '@/lib/requestQueries'
import { isFullyOnline } from '@/stores/connectivityStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
import { useAuthStore } from '@/stores/authStore'
import { useMasterDataStore } from '@/stores/masterDataStore'
import {
  mixcodeStrengthLabelForOptionValue,
  mixcodeStrengthOptionValueForStoredStrength,
  DWG_STRENGTH_FIELD_LABEL,
} from '@/lib/mixcodeStrengthOptions'
import { useFilterStore } from '@/stores/filterStore'
import { useRequestOverlayStore } from '@/stores/requestOverlayStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime, formatTime, shortId, cn, formatVolumeCuM, formatPercentNumber } from '@/lib/utils'
import { dedupeRequestLogsForDisplay } from '@/lib/requestLogDisplay'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
import { canWorkflowActOnRequest } from '@/lib/permissions'
import { useInspectorBookerScope } from '@/hooks/useInspectorBookerScope'
import { canPrintChecklistBeforePour, getRequestListQuickActions } from '@/lib/requestQuickActions'
import { localPrintChecklist } from '@/lib/checklistPrint'
import { copyRequestOrderLoadToClipboard } from '@/lib/requestOrderClipboard'
import { warmCstReportTemplateCache } from '@/lib/cstPrint'
import { RequestActionBar } from '@/components/requests/RequestActionBar'
import { RequestWorkflowModals } from '@/components/requests/RequestWorkflowModals'
import { rq, surface } from '@/lib/requestUi'
import { PageLoadError } from '@/components/shared/PageLoadError'
import { PageLoadingStatus } from '@/components/shared/PageLoadingStatus'
import {
  REQUEST_DETAIL_SEARCH_ARIA,
  REQUEST_DETAIL_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { ImageLightboxDialog } from '@/components/shared/ImageLightboxDialog'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import Edit from '@mui/icons-material/Edit'
import History from '@mui/icons-material/History'
import { AppIcon } from '@/components/icons/AppIcon'
import type { CstTestAge, RequestWithRelations, RequestLogWithProfile } from '@/types/app.types'
import { fetchCstByRequestId } from '@/lib/cstData'
import { CstFormDialog } from '@/components/requests/CstFormDialog'
import { CstAgeQuickActions } from '@/components/cst/CstAgeQuickActions'
import { NonSystemBookingBadge } from '@/components/requests/NonSystemBookingBadge'
import { isNonSystemBookingRequest, remarksForDisplay } from '@/lib/nonSystemBooking'

type RequestDetailField = {
  id: string
  label: string
  value: ReactNode
  stacked?: boolean
}

function RequestDetailFields({ fields }: { fields: RequestDetailField[] }) {
  return (
    <>
      {fields.map((row) => (
        <div key={row.id} className={cn(rq.detailRow, row.stacked && 'sm:flex-col sm:items-stretch')}>
          <span className={cn(rq.detailLabel, row.stacked && 'sm:w-full')}>{row.label}</span>
          <span className={cn(rq.value, row.stacked && 'sm:min-w-0')}>{row.value}</span>
        </div>
      ))}
    </>
  )
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role } = useAuthStore()
  const { bookerScope } = useInspectorBookerScope()
  const { mixcodes } = useMasterDataStore()
  const { filter, setFilter } = useFilterStore()
  const [request, setRequest] = useState<RequestWithRelations | null>(null)
  const [logs, setLogs] = useState<RequestLogWithProfile[]>([])
  const displayLogs = useMemo(() => dedupeRequestLogsForDisplay(logs), [logs])

  const filteredLogs = useMemo(() => {
    const q = filter.search.trim().toLowerCase()
    if (!q) return displayLogs
    return displayLogs.filter((log) => {
      const p = log.profile as { fname: string | null; lname: string | null } | null
      const name = p ? `${p.fname ?? ''} ${p.lname ?? ''}`.trim() : ''
      const blob = [log.action, log.note ?? '', name, formatDateTime(log.created_at)].join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [displayLogs, filter.search])

  useDesktopSearchRegistration({
    placeholder: REQUEST_DETAIL_SEARCH_PLACEHOLDER,
    ariaLabel: REQUEST_DETAIL_SEARCH_ARIA,
    showRequestFilterButton: true,
    search: filter.search,
    onSearchChange: (v) => setFilter({ search: v }),
  })

  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<string | null>(null)
  const [cstAge, setCstAge] = useState<CstTestAge | null>(null)

  const closeOverlayWorkflow = useRequestOverlayStore((s) => s.closeWorkflow)

  const openWorkflowModal = useCallback((m: string) => {
    closeOverlayWorkflow()
    useFilterStore.getState().setRequestFiltersOpen(false)
    setCstAge(null)
    setModal(m)
  }, [closeOverlayWorkflow])

  const openCstAge = useCallback((age: CstTestAge) => {
    setModal(null)
    setCstAge(age)
  }, [])
  const [cstAgesSaved, setCstAgesSaved] = useState<number[]>([])
  const [imageLightbox, setImageLightbox] = useState<{ items: { src: string; label: string }[] } | null>(null)

  const [error, setError] = useState<string | null>(null)
  const initialModalConsumedRef = useRef(false)

  useEffect(() => {
    initialModalConsumedRef.current = false
  }, [id])

  useEffect(() => {
    warmCstReportTemplateCache()
  }, [])

  const loadData = useCallback(async (opts?: { background?: boolean }) => {
    if (!id) return
    if (!opts?.background) setLoading(true)
    setError(null)

    const applyCached = async (): Promise<boolean> => {
      const cached = await getCachedRequestDetail(id)
      if (!cached) return false
      setRequest(cached.request)
      setLogs(cached.logs)
      setCstAgesSaved(cached.cstAgesSaved)
      useConnectivityStore.getState().setUsingOfflineCache(true)
      return true
    }

    if (!isFullyOnline()) {
      const ok = await applyCached()
      if (!ok) setError('ไม่มีข้อมูลที่บันทึกไว้สำหรับรายการนี้')
      setLoading(false)
      return
    }

    try {
      const [req, logData, cstRows] = await Promise.all([
        fetchRequestById(id),
        fetchRequestLogs(id),
        fetchCstByRequestId(id).catch(() => []),
      ])
      if (!req) throw new Error('ไม่พบข้อมูล')
      const ages = cstRows
        .map((r) => r.age)
        .filter((a): a is number => a != null && !Number.isNaN(a))
      setRequest(req)
      setLogs(logData)
      setCstAgesSaved(ages)
      useConnectivityStore.getState().setUsingOfflineCache(false)
      await cacheRequestDetail(id, req, logData, ages)
    } catch (err) {
      const ok = await applyCached()
      if (!ok) {
        setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void loadData() }, [loadData])

  useDataSyncOnTables(['Request', 'Request_Log', 'CST', '*'], (detail) => {
    if (!id) return
    if (detail.table === '*' || detail.requestId == null || detail.requestId === id) {
      void loadData({ background: true })
    }
  })

  usePullToRefreshOnLoad(() => loadData({ background: true }))

  const openPourImagesLightbox = useCallback(() => {
    if (!request) return
    const before = request.before_image?.trim()
    const after = request.after_image?.trim()
    const items: { src: string; label: string }[] = []
    if (before && after) {
      items.push(
        { src: imageSrcForImgTag(before, 'lightbox') ?? before, label: 'ก่อนเท' },
        { src: imageSrcForImgTag(after, 'lightbox') ?? after, label: 'หลังเท' },
      )
    } else if (before) {
      items.push({ src: imageSrcForImgTag(before, 'lightbox') ?? before, label: 'ก่อนเท' })
    } else if (after) {
      items.push({ src: imageSrcForImgTag(after, 'lightbox') ?? after, label: 'หลังเท' })
    }
    if (items.length) setImageLightbox({ items })
  }, [request])

  useEffect(() => {
    if (loading || !request || initialModalConsumedRef.current) return
    const m = (location.state as { initialModal?: string } | null)?.initialModal
    if (!m) return
    const allowed = ['inspect', 'approve', 'reject', 'cancel', 'confirmOrder', 'postpone', 'complete', 'reApprove', 'uploadBeforeOnly', 'uploadEslipOnly'] as const
    if (!allowed.includes(m as (typeof allowed)[number])) return
    initialModalConsumedRef.current = true
    openWorkflowModal(m)
    navigate(`/requests/${id}`, { replace: true, state: {} })
  }, [loading, request, location.state, id, navigate, openWorkflowModal])

  if (loading) {
    return (
      <div className={rq.page}>
        <RequestScreenHeader title="รายละเอียดคำขอ" onBack={() => navigate(-1)} />
        <PageLoadingStatus />
      </div>
    )
  }
  if (error) {
    return (
      <div className={rq.page}>
        <RequestScreenHeader title="รายละเอียดคำขอ" onBack={() => navigate(-1)} />
        <PageLoadError message={error} onRetry={() => void loadData()} className="mt-4" />
      </div>
    )
  }
  if (!request) {
    return (
      <div className={rq.page}>
        <RequestScreenHeader title="รายละเอียดคำขอ" onBack={() => navigate(-1)} />
        <p className="py-16 text-center text-sm text-pour-muted">ไม่พบข้อมูล</p>
      </div>
    )
  }

  const sid = request.status_id
  const isOwner = request.booked_by === user?.id
  const canAct = canWorkflowActOnRequest({
    role,
    bookerScope,
    bookedBy: request.booked_by,
    actorProfileId: user?.id,
  })
  const nonSystemBooking = isNonSystemBookingRequest(request)
  const remarksDisplay = remarksForDisplay(request.remarks)

  const mx = request.mixcode as { mixcode: string; strength: number | null; slump: string | null; strength_type: string | null } | null
  const structureName = (request.structure as { structure_name: string } | null)?.structure_name?.trim() || null
  const structureNo = request.structure_no?.trim() || null
  const loc = request.location as { full_location: string | null; location1: string } | null
  const locationDisplay = loc?.full_location ?? loc?.location1 ?? null

  const castingDatePart = request.casting_date ? formatDate(request.casting_date) : null
  const requestTimePart = request.request_time ? formatTime(request.request_time) : null
  const castingDateTime =
    castingDatePart && castingDatePart !== '-' && requestTimePart && requestTimePart !== '-'
      ? `${castingDatePart} | ${requestTimePart}`
      : castingDatePart && castingDatePart !== '-'
        ? castingDatePart
        : requestTimePart && requestTimePart !== '-'
          ? requestTimePart
          : '-'

  const jobInfoFields: RequestDetailField[] = [
    {
      id: 'req-id',
      label: 'รหัสคำขอ',
      stacked: true,
      value: (
        <span className="min-w-0">
          <span className="font-mono font-semibold text-[color:var(--pour-ink-1)]">{shortId(request.id)}</span>
          <span className="mt-1 block break-all font-mono text-pour-2xs leading-snug text-pour-subtle">{request.id}</span>
        </span>
      ),
    },
    { id: 'casting', label: 'Casting date', value: castingDateTime },
    {
      id: 'client',
      label: 'User Group',
      value: (request.client as { client_name: string } | null)?.client_name ?? '-',
    },
    { id: 'abc', label: 'ABC', value: (request.abc_code as { full_abc: string | null } | null)?.full_abc ?? '-' },
    { id: 'wbs', label: 'WBS', value: (request.wbs_code as { full_wbs: string | null } | null)?.full_wbs ?? '-' },
    {
      id: 'cw',
      label: 'Concrete Works',
      value: (request.concrete_work as { concrete_work: string } | null)?.concrete_work ?? '-',
    },
    { id: 'structure', label: 'Structure', value: structureName ?? '-' },
    { id: 'location', label: 'Location', value: locationDisplay ?? '-', stacked: true },
    { id: 'structure-no', label: 'Structure No.', value: structureNo ?? '—', stacked: true },
  ]

  const pourInfoFields: RequestDetailField[] = [
    { id: 'mixcode', label: 'Mix code', value: mx?.mixcode ?? '-' },
    {
      id: 'strength',
      label: 'กำลังอัด',
      value: mx ? `${mx.strength} ${mx.strength_type ?? ''}`.trim() : '-',
    },
    { id: 'slump', label: 'Slump', value: mx?.slump ?? '-' },
    {
      id: 'dwg-strength',
      label: DWG_STRENGTH_FIELD_LABEL,
      value:
        request.strength != null
          ? mixcodeStrengthLabelForOptionValue(
              mixcodeStrengthOptionValueForStoredStrength(request.strength, mixcodes),
              mixcodes,
            ) ?? String(request.strength)
          : '-',
    },
    { id: 'vol-req', label: 'Request Volume (cu.m)', value: formatVolumeCuM(request.volume_request) },
    { id: 'vol-dwg', label: 'DWG volume (cu.m)', value: formatVolumeCuM(request.volume_dwg) },
    { id: 'vol-actual', label: 'Actual volume (cu.m)', value: formatVolumeCuM(request.volume_actual) },
    ...(sid === 8
      ? ([
          {
            id: 'vol-confirm',
            label: 'Confirmed volume (cu.m)',
            value: formatVolumeCuM(request.volume_confirm),
          },
          {
            id: 'vol-loss',
            label: 'Volume loss (cu.m)',
            value: formatVolumeCuM(request.volume_loss),
          },
          {
            id: 'pct-loss',
            label: '% Loss',
            value:
              request.pct_loss != null && !Number.isNaN(request.pct_loss)
                ? `${formatPercentNumber(request.pct_loss)}%`
                : '-',
          },
        ] satisfies RequestDetailField[])
      : []),
    {
      id: 'sample',
      label: 'จำนวนตัวอย่าง',
      value: request.sample_qty != null ? `${request.sample_qty} ก้อน` : '-',
    },
    {
      id: 'remarks',
      label: 'หมายเหตุ',
      value: remarksDisplay ?? '—',
      stacked: true,
    },
  ]

  return (
    <div className={rq.pageDetail}>
      <RequestScreenHeader
        titleLayout="inline"
        onBack={() => navigate(-1)}
        title={
          <span className="flex min-w-0 flex-nowrap items-center gap-2">
            <span className="shrink-0 font-pour-mono font-bold tracking-tight text-[color:var(--pour-ink-1)] pour-desktop:text-lg">
              {shortId(request.id)}
            </span>
            <StatusBadge statusId={sid} size="sm" compact className="shrink-0" />
            {nonSystemBooking ? <NonSystemBookingBadge /> : null}
          </span>
        }
        right={
          sid === 1 && isOwner ? (
            <Button variant="outline" size="action" asChild>
              <Link to={`/requests/${id}/edit`}>
                <AppIcon icon={Edit} size="sm" />
                แก้ไข
              </Link>
            </Button>
          ) : null
        }
      />

      {(canAct ||
        (sid === 1 && isOwner) ||
        (sid <= 3 && isOwner) ||
        ([6, 7].includes(sid) && isOwner) ||
        canPrintChecklistBeforePour(sid)) && (
        <RequestActionBar
          dense
          items={getRequestListQuickActions({
            requestId: request.id,
            statusId: sid,
            role,
            userId: user?.id,
            bookedBy: request.booked_by,
            beforeImage: request.before_image,
            eslipUrl: request.eslip_url,
            bookerScope,
          })}
          onItemClick={(item, e) => {
            e.stopPropagation()
            if ('cloneFromRequestId' in item) {
              navigate('/requests/new', { state: { cloneFromRequestId: item.cloneFromRequestId } })
              return
            }
            if ('printChecklist' in item) {
              try {
                localPrintChecklist(request)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'พิมพ์ Checklist ไม่สำเร็จ')
              }
              return
            }
            if ('copyOrderLoad' in item) {
              void copyRequestOrderLoadToClipboard(request)
                .then(() => toast.success('คัดลอกรายการแล้ว'))
                .catch((err) =>
                  toast.error(err instanceof Error ? err.message : 'คัดลอกไม่สำเร็จ'),
                )
              return
            }
            openWorkflowModal(item.modal)
          }}
        >
          {sid === 8 && canAct ? (
            <>
              <p className={rq.actions.sectionLabel}>CST — กำลังอัดคอนกรีต (วันทดสอบ)</p>
              <CstAgeQuickActions savedAges={cstAgesSaved} onAgeClick={openCstAge} />
            </>
          ) : null}
        </RequestActionBar>
      )}

      {/* Sections */}
      <div className={rq.detailGrid}>
        <Card className={rq.card}>
          <CardHeader className={rq.detailCardHeader}>
            <CardTitle className={rq.cardTitle}>ข้อมูลงาน</CardTitle>
          </CardHeader>
          <CardContent className={cn(rq.detailCardContent, rq.detailFields)}>
            <RequestDetailFields fields={jobInfoFields} />
          </CardContent>
        </Card>

        <Card className={rq.card}>
          <CardHeader className={rq.detailCardHeader}>
            <CardTitle className={rq.cardTitle}>ข้อมูลการเท</CardTitle>
          </CardHeader>
          <CardContent className={cn(rq.detailCardContent, rq.detailFields)}>
            <RequestDetailFields fields={pourInfoFields} />
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      {(request.before_image || request.after_image || request.eslip_url || request.checksheet_url) && (
        <Card className={rq.card}>
          <CardHeader className={rq.detailCardHeader}>
            <CardTitle className={rq.cardTitle}>รูปภาพ & ไฟล์</CardTitle>
          </CardHeader>
          <CardContent className={cn(rq.detailCardContent, rq.detailImagesContent)}>
            {(request.before_image || request.after_image) && (
              <div
                className={cn(
                  'grid w-full gap-3',
                  request.before_image &&
                    request.after_image &&
                    'grid-cols-2 items-stretch gap-2 sm:gap-3',
                )}
              >
                {request.before_image && (
                  <div className="flex min-h-0 min-w-0 flex-col">
                    <p className={cn('mb-1', rq.label, request.after_image && 'text-center')}>ก่อนเท</p>
                    <button
                      type="button"
                      className="group flex min-h-0 w-full flex-1 rounded-xl p-0 text-left outline-none ring-offset-2 transition hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/40 cursor-zoom-in"
                      aria-label={request.after_image?.trim() ? 'ขยายรูปก่อนเทและหลังเท' : 'ขยายรูปก่อนเท'}
                      onClick={openPourImagesLightbox}
                    >
                      <span
                        className={cn(
                          'flex w-full flex-1 items-center justify-center rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-accent-muted)] p-1.5 shadow-sm sm:p-2',
                          request.after_image
                            ? 'min-h-[7.5rem] sm:min-h-[11rem]'
                            : 'min-h-[9.5rem] sm:min-h-[11rem]',
                        )}
                      >
                        <img
                          src={imageSrcForImgTag(request.before_image, 'detail') ?? request.before_image}
                          alt="รูปก่อนเท"
                          referrerPolicy="no-referrer"
                          className={cn(
                            'w-auto max-w-full object-contain object-center pointer-events-none',
                            request.after_image
                              ? 'max-h-32 sm:max-h-52'
                              : 'max-h-44 sm:max-h-52',
                          )}
                        />
                      </span>
                    </button>
                  </div>
                )}
                {request.after_image && (
                  <div className="flex min-h-0 min-w-0 flex-col">
                    <p className={cn('mb-1', rq.label, request.before_image && 'text-center')}>หลังเท</p>
                    <button
                      type="button"
                      className="group flex min-h-0 w-full flex-1 rounded-xl p-0 text-left outline-none ring-offset-2 transition hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/40 cursor-zoom-in"
                      aria-label={request.before_image?.trim() ? 'ขยายรูปก่อนเทและหลังเท' : 'ขยายรูปหลังเท'}
                      onClick={openPourImagesLightbox}
                    >
                      <span
                        className={cn(
                          'flex w-full flex-1 items-center justify-center rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-accent-muted)] p-1.5 shadow-sm sm:p-2',
                          request.before_image
                            ? 'min-h-[7.5rem] sm:min-h-[11rem]'
                            : 'min-h-[9.5rem] sm:min-h-[11rem]',
                        )}
                      >
                        <img
                          src={imageSrcForImgTag(request.after_image, 'detail') ?? request.after_image}
                          alt="รูปหลังเท"
                          referrerPolicy="no-referrer"
                          className={cn(
                            'w-auto max-w-full object-contain object-center pointer-events-none',
                            request.before_image
                              ? 'max-h-32 sm:max-h-52'
                              : 'max-h-44 sm:max-h-52',
                          )}
                        />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
            {request.eslip_url?.trim() ? (
              <div className="border-t border-[color:var(--pour-surface-border)]/70 pt-3">
                <p className={cn('mb-1.5', rq.label)}>Bill Concrete</p>
                <button
                  type="button"
                  className="group flex min-h-0 w-full max-w-md rounded-xl p-0 text-left outline-none ring-offset-2 transition hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/40 cursor-zoom-in"
                  aria-label="ขยายรูป Bill Concrete"
                  onClick={() => {
                    const raw = request.eslip_url!.trim()
                    setImageLightbox({
                      items: [
                        {
                          src: imageSrcForImgTag(raw, 'lightbox') ?? raw,
                          label: 'Bill Concrete',
                        },
                      ],
                    })
                  }}
                >
                  <span className="flex min-h-[9.5rem] w-full items-center justify-center rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-accent-muted)] p-2 shadow-sm sm:min-h-[11rem]">
                    <img
                      src={imageSrcForImgTag(request.eslip_url, 'detail') ?? request.eslip_url}
                      alt="Bill Concrete"
                      referrerPolicy="no-referrer"
                      className="max-h-44 w-auto max-w-full object-contain object-center pointer-events-none sm:max-h-52"
                    />
                  </span>
                </button>
              </div>
            ) : null}
            {request.checksheet_url ? (
              <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[color:var(--pour-surface-border)]/70 pt-3">
                <a href={request.checksheet_url} target="_blank" rel="noreferrer" className={rq.link}>Checksheet</a>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {nonSystemBooking ? (
        <Card className={cn(rq.card, surface.notice)}>
          <CardContent className={cn(rq.cardContent, 'text-sm')}>
            รายการนี้<strong className="font-semibold">ไม่ได้จองผ่านระบบ</strong> — บันทึกตรงเป็นสถานะ Complete (เช่น จาก CST shortcut)
          </CardContent>
        </Card>
      ) : null}

      {/* History */}
      <Card className={rq.card}>
        <CardHeader className={rq.detailCardHeader}>
          <CardTitle className={cn(rq.cardTitle, 'flex items-center gap-2')}>
            <AppIcon icon={History} size="sm" className="text-pour-muted" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(rq.detailCardContent, 'space-y-3')}>
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-pour-muted">ไม่พบรายการที่ตรงกับคำค้น</p>
          ) : (
            filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-3">
              <div className={rq.timelineDot} />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-[color:var(--pour-ink-1)]">
                  <StatusBadge statusId={log.status_id ?? 0} size="sm" />
                </p>
                <p className={cn('mt-0.5', rq.sub)}>
                  {(log.profile as { fname: string | null; lname: string | null } | null)
                    ? `${(log.profile as { fname: string | null }).fname ?? ''} ${(log.profile as { lname: string | null }).lname ?? ''}`.trim()
                    : '-'} · {formatDateTime(log.created_at)}
                </p>
                {log.note && <p className="mt-1 text-pour-muted italic">"{log.note}"</p>}
              </div>
            </div>
          ))
          )}
        </CardContent>
      </Card>

      <RequestWorkflowModals
        request={request}
        modal={modal}
        onClose={() => setModal(null)}
        onCompleted={() => void loadData({ background: true })}
      />

      <CstFormDialog
        request={request}
        age={cstAge}
        open={cstAge != null}
        onOpenChange={(open) => {
          if (!open) setCstAge(null)
        }}
        onSaved={() => void loadData({ background: true })}
      />

      <ImageLightboxDialog
        open={imageLightbox != null}
        onOpenChange={(open) => {
          if (!open) setImageLightbox(null)
        }}
        items={imageLightbox?.items}
        title={imageLightbox?.items.map((i) => i.label).join(' · ') || 'รูปภาพ'}
      />
    </div>
  )
}
