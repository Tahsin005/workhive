import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { Mutex } from 'async-mutex'
import type { RootState } from '..'
import type { ApiResponse, AuthResponse, User } from '../../types/auth'
import { clearAuth, setToken } from '../slices/authSlice'

// Mutex prevents multiple simultaneous refresh calls (e.g. parallel 401s)
const mutex = new Mutex()

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  credentials: 'include', // Important for sending/receiving cookies
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Reauth interceptor — wraps rawBaseQuery
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // wait if another request is already refreshing
  await mutex.waitForUnlock()

  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
        // attempt token rotation using HttpOnly cookie (no body needed)
        const refreshResult = await rawBaseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
          },
          api,
          extraOptions
        )

        if (refreshResult.data) {
          const data = (refreshResult.data as ApiResponse<{ token: string }>).data
          api.dispatch(setToken(data.token))
          // retry the original request with the new token
          result = await rawBaseQuery(args, api, extraOptions)
        } else {
          // refresh failed — log out (cookie is cleared by server)
          api.dispatch(clearAuth())
        }
      } finally {
        release()
      }
    } else {
      // another request is already refreshing — wait and retry with the new token
      await mutex.waitForUnlock()
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }

  return result
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    register: builder.mutation<ApiResponse<AuthResponse>, { full_name: string; email: string; password: string; role: string }>({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    login: builder.mutation<ApiResponse<AuthResponse>, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    me: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    refresh: builder.mutation<ApiResponse<{ token: string }>, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
  }),
})

export const { useRegisterMutation, useLoginMutation, useMeQuery, useRefreshMutation } = authApi
