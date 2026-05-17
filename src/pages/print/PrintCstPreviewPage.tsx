import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { PrintChecklistDocument } from '@/components/print/PrintChecklistDocument'
import {
  loadCstBlankPreviewForRequest,
  loadCstPreviewForRequest,
  parseCstAgesFromSearchParams,
  warmCstReportTemplateCache,
} from '@/lib/cstPrint'

export function PrintCstPreviewPage() {
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId')?.trim() ?? ''
  const ages = useMemo(
    () => parseCstAgesFromSearchParams(searchParams.get('age'), searchParams.get('ages')),
    [searchParams],
  )
  const agesValid = ages.length > 0
  const blank = searchParams.get('blank') === '1'
  const machineIdRaw = searchParams.get('machineId')?.trim() ?? ''
  const machineIdParsed = Number(machineIdRaw)
  const machineId =
    machineIdRaw && Number.isFinite(machineIdParsed) && machineIdParsed > 0
      ? machineIdParsed
      : undefined
  const singleAge = ages.length === 1 ? ages[0] : null
  const paramsValid = agesValid

  const { user, isLoading: authLoading } = useAuthStore()

  const [srcDoc, setSrcDoc] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState('CST Report')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    warmCstReportTemplateCache()
  }, [])

  useEffect(() => {
    if (!requestId || !paramsValid || authLoading || !user) return

    let cancelled = false
    setError(null)
    setSrcDoc(null)

    void (async () => {
      try {
        warmCstReportTemplateCache()
        const { html, title } =
          blank
            ? await loadCstBlankPreviewForRequest(requestId, ages, machineId)
            : singleAge != null
              ? await loadCstPreviewForRequest(requestId, singleAge)
              : (() => {
                  throw new Error('พิมพ์รายงาน CST ที่มีข้อมูลได้ทีละอายุเท่านั้น')
                })()
        if (cancelled) return
        document.title = title
        setPageTitle(title)
        setSrcDoc(html)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'โหลดรายงาน CST ไม่สำเร็จ')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [requestId, ages, paramsValid, blank, machineId, singleAge, authLoading, user])

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!requestId || !paramsValid) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4 text-center text-sm text-slate-600">
        ไม่พบคำขอหรืออายุตัวอย่าง — ปิดแท็บแล้วกดพิมพ์จากฟอร์ม CST อีกครั้ง
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-2 bg-slate-100 px-4 text-center">
        <p className="text-sm font-medium text-rose-700">{error}</p>
        <button
          type="button"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white"
          onClick={() => window.close()}
        >
          ปิดแท็บ
        </button>
      </div>
    )
  }

  if (!srcDoc) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-slate-100 text-slate-600">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        <p className="text-sm font-medium">กำลังโหลดรายงาน CST…</p>
      </div>
    )
  }

  return <PrintChecklistDocument srcDoc={srcDoc} title={pageTitle} fitSinglePage={false} />
}
