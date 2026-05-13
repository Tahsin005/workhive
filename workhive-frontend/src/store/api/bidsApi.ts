import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Bid, SubmitBidRequest } from '@/types/bid'
import type { ApiResponse } from '@/types/auth'
import type { RootState } from '../index'
import { jobsApi } from './jobsApi'


export interface PaginatedBids {
  data: Bid[]
  meta: {
    total_pages: number
    current_page: number
    total_items: number
    items_per_page: number
  }
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

export const bidsApi = createApi({
  reducerPath: 'bidsApi',
  baseQuery,
  tagTypes: ['Bids', 'Bid'],
  endpoints: (builder) => ({
    getMyBids: builder.query<PaginatedBids, { page?: number; limit?: number; job_id?: string; status?: string }>({
      query: (params) => ({
        url: '/bids/my',
        params,
      }),
      providesTags: (result) => 
        result 
          ? [
              ...result.data.map(({ id }) => ({ type: 'Bid' as const, id })),
              { type: 'Bids', id: 'LIST' },
            ]
          : [{ type: 'Bids', id: 'LIST' }],
    }),
    updateBid: builder.mutation<ApiResponse<Bid>, { id: string; data: Partial<SubmitBidRequest> }>({
      query: ({ id, data }) => ({
        url: `/bids/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ( _, __, { id }) => [
        { type: 'Bid', id },
        { type: 'Bids', id: 'LIST' }
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: result } = await queryFulfilled
          if (result.data?.job_id) {
            dispatch(jobsApi.util.invalidateTags([{ type: 'Job', id: result.data.job_id }]))
          }
        } catch {}
      },
    }),
    withdrawBid: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/bids/${id}/withdraw`,
        method: 'PATCH',
      }),
      invalidatesTags: ( _, __, id) => [
        { type: 'Bid', id },
        { type: 'Bids', id: 'LIST' }
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled
          // We don't have the job ID easily here without looking at the cache, 
          // but we can invalidate all jobs list to be safe, or just wait for the next fetch.
          // Better: just invalidate the Jobs list.
          dispatch(jobsApi.util.invalidateTags([{ type: 'Jobs', id: 'LIST' }]))
        } catch {}
      },
    }),
  }),
})

export const {
  useGetMyBidsQuery,
  useUpdateBidMutation,
  useWithdrawBidMutation,
} = bidsApi
