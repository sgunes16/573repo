import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Box, Spinner, Center } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const performAuthCheck = async () => {
      await checkAuth()
      setIsChecking(false)
    }
    performAuthCheck()
  }, [])

  if (isChecking) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.yellow.500" thickness="4px" />
      </Center>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Box>{children}</Box>
}

export default AdminProtectedRoute

