export interface User {
  id: string
  full_name: string
  email: string
  role: 'client' | 'freelancer' | 'admin'
  avatar_url: string | null
  bio: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface AuthResponse {
  token: string
  user: User
}
