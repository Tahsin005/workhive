import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '../api/authApi'

interface AuthState {
  token: string | null
  isInitialized: boolean
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  isInitialized: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      localStorage.setItem('token', action.payload)
    },
    clearAuth: (state) => {
      state.token = null
      state.isInitialized = true
      localStorage.removeItem('token')
    },
    setInitialized: (state) => {
      state.isInitialized = true
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApi.endpoints.me.matchFulfilled,
      (state) => {
        state.isInitialized = true
      }
    )
    builder.addMatcher(
      authApi.endpoints.me.matchRejected,
      (state) => {
        state.token = null
        state.isInitialized = true
        localStorage.removeItem('token')
      }
    )
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, action) => {
        const { token } = action.payload.data
        state.token = token
        localStorage.setItem('token', token)
      }
    )
    builder.addMatcher(
      authApi.endpoints.register.matchFulfilled,
      (state, action) => {
        const { token } = action.payload.data
        state.token = token
        localStorage.setItem('token', token)
      }
    )
  },
})

export const { setToken, clearAuth, setInitialized } = authSlice.actions
export default authSlice.reducer
