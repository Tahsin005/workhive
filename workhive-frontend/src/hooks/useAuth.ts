import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useMeQuery } from '../store/api/authApi'

export const useAuth = () => {
  const token = useSelector((state: RootState) => state.auth.token)
  const isInitialized = useSelector((state: RootState) => state.auth.isInitialized)
  
  const { data: meData, isLoading } = useMeQuery(undefined, {
    skip: !token,
  })

  const user = meData?.data ?? null
  const isAuthenticated = !!token && !!user

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
    isLoading: isLoading && !!token,
  }
}
