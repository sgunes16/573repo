import { Alert, AlertIcon, AlertTitle, AlertDescription, Box } from '@chakra-ui/react'
import { useAuthStore } from '@/store/useAuthStore'

interface BannedBannerProps {
  compact?: boolean
}

const BannedBanner = ({ compact = false }: BannedBannerProps) => {
  const { user } = useAuthStore()
  
  if (!user?.is_banned) return null
  
  if (compact) {
    return (
      <Alert status="error" borderRadius="md" mb={4}>
        <AlertIcon />
        <AlertTitle fontSize="sm">Account Suspended</AlertTitle>
      </Alert>
    )
  }
  
  return (
    <Alert
      status="error"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      py={6}
      borderRadius="lg"
      mb={4}
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        Your Account Has Been Suspended
      </AlertTitle>
      <AlertDescription maxWidth="md" fontSize="sm">
        Your account has been suspended due to a violation of our community guidelines.
        You can still browse offers and view content, but you cannot create offers,
        start exchanges, or interact with other users.
        <Box mt={2} fontWeight="500">
          If you believe this is a mistake, please contact support.
        </Box>
      </AlertDescription>
    </Alert>
  )
}

export default BannedBanner

