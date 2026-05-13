import { createApi } from '@reduxjs/toolkit/query/react'
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { AdminJob, AdminStats, AdminUser, AdminUserDetail, PaginatedResponse } from '@/types/admin'
import type { RootState } from '..'
import type { ApiResponse, User } from '@/types/auth'
import { jobsApi } from './jobsApi'
import { authApi } from './authApi'

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

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['AdminUsers', 'AdminJobs', 'AdminStats', 'AdminUserDetail'],
  endpoints: (builder) => ({
    getStats: builder.query<ApiResponse<AdminStats>, void>({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),

    getUsers: builder.query<
      PaginatedResponse<AdminUser>,
      { page?: number; limit?: number; role?: string; is_active?: string; search?: string }
    >({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: (result) => 
        result 
          ? [
              ...result.data.map(({ id }) => ({ type: 'AdminUsers' as const, id })),
              { type: 'AdminUsers', id: 'LIST' }
            ]
          : [{ type: 'AdminUsers', id: 'LIST' }],
    }),

    getUser: builder.query<ApiResponse<AdminUserDetail>, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminUserDetail', id }],
    }),

    banUser: builder.mutation<ApiResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/ban`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AdminUsers', id: 'LIST' }, 
        'AdminStats', 
        { type: 'AdminUserDetail', id }
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Refresh user profile in authApi if an admin bans them
          dispatch(authApi.util.invalidateTags([{ type: 'User', id }]))
        } catch {}
      },
    }),

    deleteUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    getJobs: builder.query<
      PaginatedResponse<AdminJob>,
      { page?: number; limit?: number; status?: string; category?: string; search?: string }
    >({
      query: (params) => ({
        url: '/admin/jobs',
        params,
      }),
      providesTags: (result) => 
        result 
          ? [
              ...result.data.map(({ id }) => ({ type: 'AdminJobs' as const, id })),
              { type: 'AdminJobs', id: 'LIST' }
            ]
          : [{ type: 'AdminJobs', id: 'LIST' }],
    }),

    getJob: builder.query<ApiResponse<AdminJob>, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminJobs', id }],
    }),

    deleteJob: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/admin/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AdminJobs', id: 'LIST' }, 
        'AdminStats'
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Invalidate main jobs list if an admin deletes a job
          dispatch(jobsApi.util.invalidateTags([{ type: 'Jobs', id: 'LIST' }]))
        } catch {}
      },
    }),
  }),
})

export const {
  useGetStatsQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useBanUserMutation,
  useDeleteUserMutation,
  useGetJobsQuery,
  useGetJobQuery,
  useDeleteJobMutation,
} = adminApi
