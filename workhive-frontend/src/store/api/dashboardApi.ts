import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { ApiResponse } from '@/types/auth'
import type { RootState } from '../index'
import type { Job } from './jobsApi'
import type { Contract } from './contractsApi'
import type { Bid } from './bidsApi'

export interface ClientDashboardData {
  stats: {
    total_jobs: number
    active_contracts: number
    total_spent: number
  }
  recent_jobs: Job[]
  recent_contracts: Contract[]
}

export interface FreelancerDashboardData {
  stats: {
    total_bids: number
    active_contracts: number
    total_earnings: number
  }
  recent_bids: Bid[]
  recent_contracts: Contract[]
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery,
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getClientDashboard: builder.query<ApiResponse<ClientDashboardData>, void>({
      query: () => '/dashboard/client',
      providesTags: ['Dashboard'],
    }),
    getFreelancerDashboard: builder.query<ApiResponse<FreelancerDashboardData>, void>({
      query: () => '/dashboard/freelancer',
      providesTags: ['Dashboard'],
    }),
  }),
})

export const { 
  useGetClientDashboardQuery, 
  useGetFreelancerDashboardQuery 
} = dashboardApi
