import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { rq, theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { useAppRealtimeSync } from '@/hooks/useAppRealtimeSync'
import { usePushNotificationAutoSync } from '@/hooks/usePushNotificationAutoSync'
import { useRequestPushOnRealtime } from '@/hooks/useRequestPushOnRealtime'
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { TouchPressEnhancer } from '@/components/motion/TouchPressEnhancer'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { CompleteProfilePage } from '@/pages/auth/CompleteProfilePage'
import { PendingApprovalPage } from '@/pages/auth/PendingApprovalPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { RequestListPage } from '@/pages/requests/RequestListPage'
import { RequestNewPage } from '@/pages/requests/RequestNewPage'
import { RequestDetailPage } from '@/pages/requests/RequestDetailPage'
import { RequestEditPage } from '@/pages/requests/RequestEditPage'
import { BookingSummaryPage } from '@/pages/requests/BookingSummaryPage'
import { APP_HOME } from '@/lib/appHome'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { LossConcretePage } from '@/pages/admin/LossConcretePage'
import { UsersPage } from '@/pages/admin/UsersPage'
import { ClientPage } from '@/pages/admin/ClientPage'
import { LocationPage } from '@/pages/admin/LocationPage'
import { ConcreteWorksPage } from '@/pages/admin/ConcreteWorksPage'
import { StructurePage } from '@/pages/admin/StructurePage'
import { MixcodePage } from '@/pages/admin/MixcodePage'
import { AbcCodePage } from '@/pages/admin/AbcCodePage'
import { WbsCodePage } from '@/pages/admin/WbsCodePage'
import { JobsPage } from '@/pages/admin/JobsPage'
import { CstMachinePage } from '@/pages/admin/CstMachinePage'
import { InspectorPage } from '@/pages/admin/InspectorPage'
import { FormTemplatesPreviewPage } from '@/pages/preview/FormTemplatesPreviewPage'
import { PrintChecklistPreviewPage } from '@/pages/print/PrintChecklistPreviewPage'
import { PrintCstPreviewPage } from '@/pages/print/PrintCstPreviewPage'
import { PrintCstFilterPreviewPage } from '@/pages/print/PrintCstFilterPreviewPage'
import { PrintConcreteSummaryPreviewPage } from '@/pages/print/PrintConcreteSummaryPreviewPage'
import { PrintBookingSummaryPreviewPage } from '@/pages/print/PrintBookingSummaryPreviewPage'
import { CstListPage } from '@/pages/cst/CstListPage'
import { ConcreteSummaryPage } from '@/pages/cst/ConcreteSummaryPage'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AppThemeProvider } from '@/components/providers/AppThemeProvider'

function SupabaseConfigMissing() {
  return (
    <div
      className={cn(
        'flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-6 text-center',
        theme.shell,
      )}
    >
      <p className="text-lg font-semibold text-[color:var(--pour-ink-0)]">ตั้งค่า Supabase ไม่ครบ</p>
      <p className="max-w-md text-sm text-pour-muted">
        บน Cloudflare Pages → Settings → Environment variables ใส่{' '}
        <code className="text-pour-subtle">VITE_SUPABASE_URL</code>,{' '}
        <code className="text-pour-subtle">VITE_SUPABASE_ANON_KEY</code>,{' '}
        <code className="text-pour-subtle">VITE_WEB_PUSH_PUBLIC_KEY</code> แล้วกด <strong>Redeploy</strong>
      </p>
    </div>
  )
}

function AppInner() {
  useAuthInit()
  useAppRealtimeSync()
  usePushNotificationAutoSync()
  useRequestPushOnRealtime()
  const { isLoading } = useAuthStore()
  const { pathname } = useLocation()
  const isPrintRoute = pathname.startsWith('/print/')

  if (isLoading && !isPrintRoute) {
    return (
      <div className={cn('flex min-h-[100dvh] items-center justify-center', theme.shell)}>
        <div className={rq.spinner} />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />

      <Route path="/print/checklist" element={<PrintChecklistPreviewPage />} />
      <Route path="/print/cst" element={<PrintCstPreviewPage />} />
      <Route path="/print/cst-filter" element={<PrintCstFilterPreviewPage />} />
      <Route path="/print/concrete-summary" element={<PrintConcreteSummaryPreviewPage />} />
      <Route path="/print/booking-summary" element={<PrintBookingSummaryPreviewPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to={APP_HOME} replace />} />
        <Route path="/requests" element={<RequestListPage />} />
        <Route path="/requests/new" element={<RequestNewPage />} />
        <Route path="/requests/booking-summary" element={<BookingSummaryPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/requests/:id/edit" element={<RequestEditPage />} />
        <Route path="/cst/concrete-summary" element={<ConcreteSummaryPage />} />
        <Route path="/cst" element={<CstListPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/preview/forms" element={<FormTemplatesPreviewPage />} />
        <Route path="/preview/checklist-before-concrete" element={<Navigate to="/preview/forms" replace />} />
        <Route path="/preview/cst-strength-report" element={<Navigate to="/preview/forms" replace />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="loss-concrete" element={<LossConcretePage />} />
          <Route path="inspector" element={<InspectorPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="client" element={<ClientPage />} />
          <Route path="location" element={<LocationPage />} />
          <Route path="concrete-works" element={<ConcreteWorksPage />} />
          <Route path="structure" element={<StructurePage />} />
          <Route path="mixcode" element={<MixcodePage />} />
          <Route path="abc-code" element={<AbcCodePage />} />
          <Route path="wbs-code" element={<WbsCodePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="cst-machine" element={<CstMachinePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <AppThemeProvider>
        <SupabaseConfigMissing />
      </AppThemeProvider>
    )
  }

  return (
    <AppThemeProvider>
      <BrowserRouter>
        <TouchPressEnhancer />
        <AppInner />
        <Toaster position="top-center" />
      </BrowserRouter>
    </AppThemeProvider>
  )
}
