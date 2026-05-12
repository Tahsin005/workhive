import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import { authApi } from './api/authApi'
import { adminApi } from './api/adminApi'
import { jobsApi } from './api/jobsApi'
import { bidsApi } from './api/bidsApi'
import { contractsApi } from './api/contractsApi'
import { reviewsApi } from './api/reviewsApi'
import { messagesApi } from './api/messagesApi'
import { paymentsApi } from './api/paymentsApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [jobsApi.reducerPath]: jobsApi.reducer,
    [bidsApi.reducerPath]: bidsApi.reducer,
    [contractsApi.reducerPath]: contractsApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [paymentsApi.reducerPath]: paymentsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      adminApi.middleware,
      jobsApi.middleware,
      bidsApi.middleware,
      contractsApi.middleware,
      reviewsApi.middleware,
      messagesApi.middleware,
      paymentsApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
