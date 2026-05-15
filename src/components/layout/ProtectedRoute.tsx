import { Navigate } from 'react-router-dom'
import { APP_HOME } from '@/lib/appHome'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/app.types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, isLoading, profileHydrated } = useAuthStore()

  if (isLoading) {
    return (
      <div className="pour-shell flex h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!profileHydrated) {
    return (
      <div className="pour-shell flex h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]" />
      </div>
    )
  }

  if (!profile?.employee_id) return <Navigate to="/complete-profile" replace />

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={APP_HOME} replace />
  }

  return <>{children}</>
}
