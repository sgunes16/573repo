import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Center, Spinner } from '@chakra-ui/react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import CreateOfferPage from './pages/CreateOfferPage'
import OfferDetailPage from './pages/OfferDetailPage'
import TransactionsPage from './pages/TransactionsPage'
import HandshakePage from './pages/HandshakePage'
import WantsPage from './pages/WantsPage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import OnboardingPage from './pages/OnboardingPage'
import AdminPage from './pages/AdminPage'
import NotificationsPage from './pages/NotificationsPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import VerifyEmailSentPage from './pages/VerifyEmailSentPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import { useAuthStore } from './store/useAuthStore'

function App() {
  const { checkAuth, isLoading, user } = useAuthStore()
  const location = useLocation()
  
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/signup' ||
                     location.pathname === '/' ||
                     location.pathname.startsWith('/verify')

  // Check auth status on app load (from cookies) - skip on auth pages
  useEffect(() => {
    if (!isAuthPage) {
      checkAuth()
    }
  }, []) // Only run once on mount

  // Show loading spinner while checking auth (not on auth pages)
  if (isLoading && !user && !isAuthPage) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="yellow.500" thickness="4px" />
      </Center>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      
      {/* Public Routes - Accessible without login */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/offer/:id" element={<OfferDetailPage />} />

      {/* Protected Routes */}
      <Route
        path="/create-offer"
        element={
          <ProtectedRoute>
            <CreateOfferPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/wants"
        element={
          <ProtectedRoute>
            <WantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <EditProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/handshake/exchange/:exchangeId"
        element={
          <ProtectedRoute>
            <HandshakePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/handshake/offer/:offerId"
        element={
          <ProtectedRoute>
            <HandshakePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminPage />
          </AdminProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

