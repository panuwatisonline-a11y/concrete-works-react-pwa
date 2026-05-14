import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { rq, theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { RequestListPage } from '@/pages/requests/RequestListPage'
import { RequestNewPage } from '@/pages/requests/RequestNewPage'
import { RequestDetailPage } from '@/pages/requests/RequestDetailPage'
import { RequestEditPage } from '@/pages/requests/RequestEditPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { UsersPage } from '@/pages/admin/UsersPage'
import { ClientPage } from '@/pages/admin/ClientPage'
import { LocationPage } from '@/pages/admin/LocationPage'
import { ConcreteWorksPage } from '@/pages/admin/ConcreteWorksPage'
import { StructurePage } from '@/pages/admin/StructurePage'
import { MixcodePage } from '@/pages/admin/MixcodePage'
import { AbcCodePage } from '@/pages/admin/AbcCodePage'
import { WbsCodePage } from '@/pages/admin/WbsCodePage'
import { JobsPage } from '@/pages/admin/JobsPage'

function AppInner() {
  useAuthInit()
  const { isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className={cn('flex min-h-[100dvh] items-center justify-center', theme.shell)}>
        <div className={rq.spinner} />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/requests" replace />} />
        <Route path="/requests" element={<RequestListPage />} />
        <Route path="/requests/new" element={<RequestNewPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/requests/:id/edit" element={<RequestEditPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="client" element={<ClientPage />} />
          <Route path="location" element={<LocationPage />} />
          <Route path="concrete-works" element={<ConcreteWorksPage />} />
          <Route path="structure" element={<StructurePage />} />
          <Route path="mixcode" element={<MixcodePage />} />
          <Route path="abc-code" element={<AbcCodePage />} />
          <Route path="wbs-code" element={<WbsCodePage />} />
          <Route path="jobs" element={<JobsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
      <Toaster position="top-center" />
    </BrowserRouter>
  )
}
