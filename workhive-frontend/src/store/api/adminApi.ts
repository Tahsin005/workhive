import { createApi } from '@reduxjs/toolkit/query/react'
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { AdminJob, AdminStats, AdminUser, AdminUserDetail, PaginatedResponse } from '@/types/admin'
import type { RootState } from '..'
import type { ApiResponse } from '@/types/auth'

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
      providesTags: ['AdminUsers'],
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
      invalidatesTags: ['AdminUsers', 'AdminStats', 'AdminUserDetail'],
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
      providesTags: ['AdminJobs'],
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
      invalidatesTags: ['AdminJobs', 'AdminStats'],
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
