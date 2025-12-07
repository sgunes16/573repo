import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import CreateOfferPage from './pages/CreateOfferPage'
import OfferDetailPage from './pages/OfferDetailPage'
import TransactionsPage from './pages/TransactionsPage'
import HandshakePage from './pages/HandshakePage'
import AchievementTreePage from './pages/AchievementTreePage'
import WantsPage from './pages/WantsPage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import OnboardingPage from './pages/OnboardingPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-offer"
        element={
          <ProtectedRoute>
            <CreateOfferPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/offer/:id"
        element={
          <ProtectedRoute>
            <OfferDetailPage />
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
        path="/achievements"
        element={
          <ProtectedRoute>
            <AchievementTreePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

