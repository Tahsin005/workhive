import { Navigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

export default function RedirectByRole() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  switch (user.role) {
    case 'client':
      return <Navigate to="/client/dashboard" replace />
    case 'freelancer':
      return <Navigate to="/freelancer/dashboard" replace />
    case 'admin':
      return <Navigate to="/admin" replace />
    default:
      return <Navigate to="/login" replace />
  }
}
