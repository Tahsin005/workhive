import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { ApiResponse } from '@/types/auth'
import type { Message, SendMessageRequest } from '@/types/message'
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

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery,
  tagTypes: ['Messages', 'UnreadCount'],
  endpoints: (builder) => ({
    getHistory: builder.query<ApiResponse<Message[]>, string>({
      query: (contractId) => `/messages/${contractId}`,
      providesTags: (result, error, contractId) => [{ type: 'Messages', id: contractId }],
    }),
    getUnreadCount: builder.query<ApiResponse<{ total: number }>, void>({
      query: () => '/messages/unread',
      providesTags: ['UnreadCount'],
    }),
    sendMessage: builder.mutation<ApiResponse<Message>, { contractId: string; body: SendMessageRequest }>({
      query: ({ contractId, body }) => ({
        url: `/messages/${contractId}`,
        method: 'POST',
        body,
      }),
    }),
    markAsRead: builder.mutation<ApiResponse<{ updated: number }>, string>({
      query: (contractId) => ({
        url: `/messages/${contractId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, contractId) => [
        { type: 'Messages', id: contractId },
        'UnreadCount'
      ],
    }),
  }),
})

export const { 
  useGetHistoryQuery, 
  useGetUnreadCountQuery,
  useSendMessageMutation, 
  useMarkAsReadMutation 
} = messagesApi
