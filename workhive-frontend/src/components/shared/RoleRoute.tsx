import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

interface RoleRouteProps {
  allowedRoles: string[]
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
