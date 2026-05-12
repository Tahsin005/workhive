import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { Mutex } from 'async-mutex'
import type { RootState } from '..'
import type { ApiResponse, AuthResponse, TokenPair, User } from '../../types/auth'
import { clearAuth, setToken } from '../slices/authSlice'

// Mutex prevents multiple simultaneous refresh calls (e.g. parallel 401s)
const mutex = new Mutex()

// No `credentials: 'include'` — refresh token is in localStorage, not a cookie
const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Reauth interceptor — uses localStorage refresh token on 401
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await mutex.waitForUnlock()

  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
        const refreshToken = localStorage.getItem('refreshToken')

        if (!refreshToken) {
          api.dispatch(clearAuth())
          return result
        }

        // Send refresh token in request body
        const refreshResult = await rawBaseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refresh_token: refreshToken },
          },
          api,
          extraOptions
        )

        if (refreshResult.data) {
          const data = (refreshResult.data as ApiResponse<TokenPair>).data
          api.dispatch(setToken(data.token))
          localStorage.setItem('token', data.token)
          localStorage.setItem('refreshToken', data.refresh_token)
          // Retry the original request with the new access token
          result = await rawBaseQuery(args, api, extraOptions)
        } else {
          // Refresh failed — log the user out completely
          api.dispatch(clearAuth())
        }
      } finally {
        release()
      }
    } else {
      // Another request is already refreshing — wait and retry
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
    refresh: builder.mutation<ApiResponse<TokenPair>, { refresh_token: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),
    getUserProfile: builder.query<ApiResponse<User>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    updateProfile: builder.mutation<ApiResponse<User>, { full_name: string; bio?: string }>({
      query: (body) => ({
        url: '/auth/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateAvatar: builder.mutation<ApiResponse<User>, FormData>({
      query: (body) => ({
        url: '/auth/me/avatar',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<ApiResponse<void>, any>({
      query: (body) => ({
        url: '/auth/me/password',
        method: 'PUT',
        body,
      }),
    }),
  }),
})

export const { 
  useRegisterMutation, 
  useLoginMutation, 
  useMeQuery, 
  useRefreshMutation, 
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useUpdateAvatarMutation,
  useChangePasswordMutation
} = authApi
