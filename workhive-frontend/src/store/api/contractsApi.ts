import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Contract } from '@/types/contract'
import type { ApiResponse } from '@/types/auth'
import type { RootState } from '../index'

interface ContractListResponse {
  success: boolean
  message: string
  data: Contract[]
  pagination: {
    total: number
    page: number
    limit: number
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

export const contractsApi = createApi({
  reducerPath: 'contractsApi',
  baseQuery,
  tagTypes: ['Contracts', 'Contract'],
  endpoints: (builder) => ({
    getContracts: builder.query<ContractListResponse, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/contracts',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Contract' as const, id })),
              { type: 'Contracts', id: 'LIST' },
            ]
          : [{ type: 'Contracts', id: 'LIST' }],
    }),
    getContract: builder.query<ApiResponse<Contract>, string>({
      query: (id) => `/contracts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Contract', id }],
    }),
    cancelContract: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/contracts/${id}/cancel`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Contract', id },
        { type: 'Contracts', id: 'LIST' }
      ],
    }),
    completeContract: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/contracts/${id}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Contract', id },
        { type: 'Contracts', id: 'LIST' }
      ],
    }),
  }),
})

export const {
  useGetContractsQuery,
  useGetContractQuery,
  useCancelContractMutation,
  useCompleteContractMutation,
} = contractsApi
