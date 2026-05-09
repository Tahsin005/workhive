import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Route, Routes } from "react-router"
import { useAuth } from "./hooks/useAuth"
import { setInitialized } from "./store/slices/authSlice"

// Pages
import Home from "./components/Home"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"

// Components
import GlobalLoader from "./components/GlobalLoader"
import { Toaster } from "./components/ui/sonner"
import type { RootState } from "./store"

function App() {
  const dispatch = useDispatch()
  const { isInitialized } = useAuth()
  const token = useSelector((state: RootState) => state.auth.token)

  useEffect(() => {
    if (!token) {
      dispatch(setInitialized())
    }
  }, [token, dispatch])

  if (!isInitialized) {
    return <GlobalLoader />
  }

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </main>
  )
}

export default App
