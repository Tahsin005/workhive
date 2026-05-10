import { UserBrief } from './auth'
import { JobBrief } from './job'

export interface BidBrief {
  id: string
  amount: number
  status: string
}

export interface Contract {
  id: string
  amount: number
  status: 'active' | 'completed' | 'cancelled'
  started_at: string
  completed_at?: string
  created_at: string
  updated_at: string
  job?: JobBrief
  bid?: BidBrief
  client?: UserBrief
  freelancer?: UserBrief
}

export interface PaginatedContracts {
  data: Contract[]
  meta: {
    total_pages: number
    current_page: number
    total_items: number
    items_per_page: number
  }
}
