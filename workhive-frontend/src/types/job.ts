import type { UserBrief } from "./auth"
import type { PaginatedResponse } from "./admin"

export interface Job {
  id: string
  client_id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  category: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  client: UserBrief
}

export interface CreateJobRequest {
  title: string
  description: string
  budget_min: number
  budget_max: number
  category: string
}

export interface UpdateJobRequest {
  title?: string
  description?: string
  budget_max?: number
}

export type PaginatedJobs = PaginatedResponse<Job>
