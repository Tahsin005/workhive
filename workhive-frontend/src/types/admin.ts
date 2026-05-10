import { UserBrief } from './auth'

export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: 'client' | 'freelancer' | 'admin'
  avatar_url?: string
  bio?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
}

export interface AdminUserStats {
  total_jobs: number
  total_bids: number
  total_contracts: number
}

export interface AdminUserDetail extends AdminUser {
  stats: AdminUserStats
}

export interface AdminJob {
  id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  category: string
  status: string
  bid_count: number
  created_at: string
  client: UserBrief
}

export interface AdminStats {
  users: {
    total: number
    clients: number
    freelancers: number
  }
  jobs: {
    total: number
    open: number
  }
  contracts: {
    total: number
    active: number
    completed: number
  }
  revenue: {
    total_paid: number
    total_pending: number
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}
