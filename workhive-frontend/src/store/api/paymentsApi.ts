import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { ApiResponse } from '@/types/auth'
import type { RootState } from '../index'

export interface Payment {
  id: string
  contract_id: string
  client_id: string
  freelancer_id: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  stripe_payment_intent_id: string
  created_at: string
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

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery,
  tagTypes: ['Payment', 'ContractPayments'],
  endpoints: (builder) => ({
    getPaymentByContract: builder.query<ApiResponse<Payment>, string>({
      query: (contractId) => `/payments/contract/${contractId}`,
      providesTags: (result, error, id) => [{ type: 'ContractPayments', id }],
    }),
    createPaymentIntent: builder.mutation<ApiResponse<{ client_secret: string; payment_intent_id: string }>, { contract_id: string }>({
      query: (body) => ({
        url: '/payments/intent',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { 
  useGetPaymentByContractQuery, 
  useCreatePaymentIntentMutation 
} = paymentsApi
