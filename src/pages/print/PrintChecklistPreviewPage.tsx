import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { PrintChecklistDocument } from '@/components/print/PrintChecklistDocument'
import { loadChecklistPreviewForRequest, warmChecklistTemplateCache } from '@/lib/checklistPrint'

export function PrintChecklistPreviewPage() {
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId')?.trim() ?? ''
  const { user, isLoading: authLoading } = useAuthStore()

  const [srcDoc, setSrcDoc] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState('Checklist')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    warmChecklistTemplateCache()
  }, [])

  useEffect(() => {
    if (!requestId || authLoading || !user) return

    let cancelled = false
    setError(null)
    setSrcDoc(null)

    void (async () => {
      try {
        warmChecklistTemplateCache()
        const { html, title } = await loadChecklistPreviewForRequest(requestId)
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
  }, [requestId, authLoading, user])

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

  if (!requestId) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4 text-center text-sm text-slate-600">
        ไม่พบรหัสคำขอ — ปิดแท็บแล้วกดพิมพ์จากแอปอีกครั้ง
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

  return <PrintChecklistDocument srcDoc={srcDoc} title={pageTitle} />
}
