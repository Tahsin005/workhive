import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Bid, SubmitBidRequest } from '@/types/bid'
import type { ApiResponse } from '@/types/auth'
import type { RootState } from '../index'

// We need a paginated wrapper for bids
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
    getMyBids: builder.query<PaginatedBids, { page?: number; limit?: number }>({
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
      invalidatesTags: (result, error, { id }) => [
        { type: 'Bid', id },
        { type: 'Bids', id: 'LIST' }
      ],
    }),
    withdrawBid: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/bids/${id}/withdraw`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Bid', id },
        { type: 'Bids', id: 'LIST' }
      ],
    }),
  }),
})

export const {
  useGetMyBidsQuery,
  useUpdateBidMutation,
  useWithdrawBidMutation,
} = bidsApi
