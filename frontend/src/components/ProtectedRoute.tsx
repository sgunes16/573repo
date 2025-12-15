import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Box, Spinner, Center } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { profileService } from '@/services/profile.service'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    const performAuthCheck = async () => {
      await checkAuth()
      setIsChecking(false)
    }
    performAuthCheck()
  }, []) 

  // Check onboarding status after auth is confirmed
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isChecking && isAuthenticated) {
        try {
          const [profile] = await profileService.getUserProfile()
          setIsOnboarded(profile?.is_onboarded ?? false)
        } catch {
          setIsOnboarded(false)
        }
      }
    }
    checkOnboarding()
  }, [isChecking, isAuthenticated])

  if (isChecking || (isAuthenticated && isOnboarded === null)) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.yellow.500" thickness="4px" />
      </Center>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect to onboarding if not onboarded (except if already on onboarding page)
  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <Box>{children}</Box>
}

export default ProtectedRoute
