import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useAuth } from "./hooks/useAuth"
import { setInitialized } from "./store/slices/authSlice"

// Components
import GlobalLoader from "./components/GlobalLoader"
import { Toaster } from "./components/ui/sonner"
import type { RootState } from "./store"

// Layouts & Guards
import RootLayout from "./components/layout/RootLayout"
import ClientLayout from "./components/layout/ClientLayout"
import FreelancerLayout from "./components/layout/FreelancerLayout"
import AdminLayout from "./components/layout/AdminLayout"
import ProtectedRoute from "./components/shared/ProtectedRoute"
import RoleRoute from "./components/shared/RoleRoute"
import RedirectByRole from "./components/shared/RedirectByRole"

// Public Pages
import LandingPage from "./pages/public/LandingPage"
import NotFoundPage from "./pages/public/NotFoundPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import PublicProfilePage from "./pages/shared/PublicProfilePage"

// Client Pages
import ClientDashboard from "./pages/client/ClientDashboard"
import PostJobPage from "./pages/client/PostJobPage"
import MyJobsPage from "./pages/client/MyJobsPage"
import ClientJobDetailPage from "./pages/client/JobDetailPage"
import EditJobPage from "./pages/client/EditJobPage"
import JobBidsPage from "./pages/client/JobBidsPage"
import ClientContractsPage from "./pages/client/ClientContractsPage"
import ClientContractDetailPage from "./pages/client/ClientContractDetailPage"
import PaymentsPage from "./pages/client/PaymentsPage"
import CheckoutPage from "./pages/client/CheckoutPage"

// Freelancer Pages
import FreelancerDashboard from "./pages/freelancer/FreelancerDashboard"
import BrowseJobsPage from "./pages/freelancer/BrowseJobsPage"
import FreelancerJobDetailPage from "./pages/freelancer/JobDetailPage"
import MyBidsPage from "./pages/freelancer/MyBidsPage"
import FreelancerContractsPage from "./pages/freelancer/FreelancerContractsPage"
import FreelancerContractDetailPage from "./pages/freelancer/FreelancerContractDetailPage"

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUsersPage from "./pages/admin/AdminUsersPage"
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage"
import AdminJobsPage from "./pages/admin/AdminJobsPage"
import AdminJobDetailPage from "./pages/admin/AdminJobDetailPage"

// Shared
import ProfilePage from "./pages/shared/ProfilePage"
import { Route, Routes } from "react-router"

function App() {
  const dispatch = useDispatch()
  const { isInitialized } = useAuth()
  const token = useSelector((state: RootState) => state.auth.token)

  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!token) {
      dispatch(setInitialized())
    }
  }, [token, dispatch])

  if (!isInitialized || showLoader) {
    return <GlobalLoader />
  }

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Routes>
        {/* public routes */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/:id" element={<PublicProfilePage />} />
        </Route>

        {/* protected catch-all */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<RedirectByRole />} />
        </Route>

        {/* client routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['client']} />}>
            <Route element={<ClientLayout />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/jobs/post" element={<PostJobPage />} />
              <Route path="/client/jobs/my" element={<MyJobsPage />} />
              <Route path="/client/jobs/:id" element={<ClientJobDetailPage />} />
              <Route path="/client/jobs/:id/edit" element={<EditJobPage />} />
              <Route path="/client/jobs/:id/bids" element={<JobBidsPage />} />
              <Route path="/client/contracts" element={<ClientContractsPage />} />
              <Route path="/client/contracts/:id" element={<ClientContractDetailPage />} />
              <Route path="/client/contracts/:id/pay" element={<CheckoutPage />} />
              <Route path="/client/payments" element={<PaymentsPage />} />
              <Route path="/client/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* freelancer routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['freelancer']} />}>
            <Route element={<FreelancerLayout />}>
              <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
              <Route path="/freelancer/jobs" element={<BrowseJobsPage />} />
              <Route path="/freelancer/jobs/:id" element={<FreelancerJobDetailPage />} />
              <Route path="/freelancer/bids/my" element={<MyBidsPage />} />
              <Route path="/freelancer/contracts" element={<FreelancerContractsPage />} />
              <Route path="/freelancer/contracts/:id" element={<FreelancerContractDetailPage />} />
              <Route path="/freelancer/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
              <Route path="/admin/jobs" element={<AdminJobsPage />} />
              <Route path="/admin/jobs/:id" element={<AdminJobDetailPage />} />
            </Route>
          </Route>
        </Route>

        {/* catch all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </main>
  )
}

export default App
