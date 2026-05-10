import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Job, CreateJobRequest, UpdateJobRequest, PaginatedJobs } from '@/types/job'
import type { Bid } from '@/types/bid'
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
  }),
})

export const {
  useGetMyJobsQuery,
  useGetJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetJobBidsQuery,
} = jobsApi
