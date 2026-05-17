import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { PrintChecklistDocument } from '@/components/print/PrintChecklistDocument'
import {
  loadCstFilterPreviewForSchedule,
  warmCstFilterScheduleTemplateCache,
} from '@/lib/cstFilterPrint'

export function PrintCstFilterPreviewPage() {
  const [searchParams] = useSearchParams()
  const testDateIso = useMemo(() => searchParams.get('testDate')?.trim() ?? '', [searchParams])
  const search = useMemo(() => searchParams.get('search')?.trim() ?? '', [searchParams])

  const { user, isLoading: authLoading } = useAuthStore()
  const [srcDoc, setSrcDoc] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState('CST Filter Schedule')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    warmCstFilterScheduleTemplateCache()
  }, [])

  useEffect(() => {
    if (!testDateIso || authLoading || !user) return

    let cancelled = false
    setError(null)
    setSrcDoc(null)

    void (async () => {
      try {
        warmCstFilterScheduleTemplateCache()
        const { html, title } = await loadCstFilterPreviewForSchedule(testDateIso, search)
        if (cancelled) return
        document.title = title
        setPageTitle(title)
        setSrcDoc(html)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'โหลดเอกสารไม่สำเร็จ')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [testDateIso, search, authLoading, user])

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

  if (!testDateIso) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4 text-center text-sm text-slate-600">
        ไม่พบวันทดสอบ — ปิดแท็บแล้วกดพิมพ์จากหน้า Filter for CST อีกครั้ง
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
        <p className="text-sm font-medium">กำลังโหลดเอกสาร…</p>
      </div>
    )
  }

  return (
    <PrintChecklistDocument srcDoc={srcDoc} title={pageTitle} fitSinglePage={false} />
  )
}
