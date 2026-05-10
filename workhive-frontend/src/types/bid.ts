import type { UserBrief } from './auth'
import type { Job } from './job'

export interface Bid {
  id: string
  job_id: string
  freelancer_id: string
  amount: number
  cover_letter: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: string
  updated_at: string
  freelancer?: UserBrief
  job?: Job
}

export interface SubmitBidRequest {
  amount: number
  cover_letter: string
}
