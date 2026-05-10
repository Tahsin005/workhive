import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Job, CreateJobRequest, UpdateJobRequest, PaginatedJobs } from '@/types/job'
import type { Bid, SubmitBidRequest } from '@/types/bid'
import type { ApiResponse } from '@/types/auth'
import type { RootState } from '../index'

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

export const jobsApi = createApi({
  reducerPath: 'jobsApi',
  baseQuery,
  tagTypes: ['Jobs', 'MyJobs', 'Job', 'JobBids'],
  endpoints: (builder) => ({
    getJobs: builder.query<PaginatedJobs, { page?: number; limit?: number; category?: string; search?: string; min_price?: number; max_price?: number }>({
      query: (params) => ({
        url: '/jobs',
        params,
      }),
      providesTags: ['Jobs'],
    }),
    getMyJobs: builder.query<PaginatedJobs, { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/jobs/my',
        params,
      }),
      providesTags: ['MyJobs'],
    }),
    getJob: builder.query<ApiResponse<Job>, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),
    createJob: builder.mutation<ApiResponse<Job>, CreateJobRequest>({
      query: (body) => ({
        url: '/jobs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Jobs', 'MyJobs'],
    }),
    updateJob: builder.mutation<ApiResponse<Job>, { id: string; data: UpdateJobRequest }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        'MyJobs',
        'Jobs'
      ],
    }),
    deleteJob: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MyJobs', 'Jobs'],
    }),
    getJobBids: builder.query<ApiResponse<Bid[]>, string>({
      query: (id) => `/jobs/${id}/bids`,
      providesTags: (result, error, id) => [{ type: 'JobBids', id }],
    }),
    submitBid: builder.mutation<ApiResponse<Bid>, { id: string; data: SubmitBidRequest }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}/bids`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'JobBids', id },
        { type: 'Job', id },
        'Jobs'
      ],
    }),
    acceptBid: builder.mutation<ApiResponse<Bid>, { bidId: string; jobId: string }>({
      query: ({ bidId }) => ({
        url: `/bids/${bidId}/accept`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, { jobId }) => [
        { type: 'JobBids', id: jobId },
        { type: 'Job', id: jobId },
        'MyJobs',
        'Jobs'
      ],
    }),
    rejectBid: builder.mutation<ApiResponse<void>, { bidId: string; jobId: string }>({
      query: ({ bidId }) => ({
        url: `/bids/${bidId}/reject`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, { jobId }) => [
        { type: 'JobBids', id: jobId }
      ],
    }),
  }),
})

export const {
  useGetJobsQuery,
  useGetMyJobsQuery,
  useGetJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetJobBidsQuery,
  useSubmitBidMutation,
  useAcceptBidMutation,
  useRejectBidMutation,
} = jobsApi
