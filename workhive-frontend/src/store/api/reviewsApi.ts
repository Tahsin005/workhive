import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { ApiResponse, UserBrief } from '@/types/auth'
import type { RootState } from '../index'

export interface Review {
  id: string
  contract_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: UserBrief
  reviewee?: UserBrief
}

export interface UserReviewsResponse {
  stats: {
    average_rating: number
    total_reviews: number
  }
  reviews: Review[]
}

export interface SubmitReviewRequest {
  rating: number
  comment?: string
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

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery,
  tagTypes: ['Reviews', 'UserReviews'],
  endpoints: (builder) => ({
    getUserReviews: builder.query<ApiResponse<UserReviewsResponse>, { userId: string; page?: number; limit?: number }>({
      query: ({ userId, ...params }) => ({
        url: `/reviews/user/${userId}`,
        params,
      }),
      providesTags: (result, error, { userId }) => [{ type: 'UserReviews', id: userId }],
    }),
    submitReview: builder.mutation<ApiResponse<Review>, { contractId: string; body: SubmitReviewRequest }>({
      query: ({ contractId, body }) => ({
        url: `/reviews/contract/${contractId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['UserReviews', 'Reviews'],
    }),
  }),
})

export const { useGetUserReviewsQuery, useSubmitReviewMutation } = reviewsApi
