import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Image,
  Spinner,
  Stack,
  Text,
  VStack,
  useToast,
  Icon,
} from '@chakra-ui/react'
import { MdCheckCircle, MdError, MdRefresh } from 'react-icons/md'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthIllustration from '@/components/AuthIllustration'
import { authService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import { useAuthStore } from '@/store/useAuthStore'

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired'

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { user, checkAuth } = useAuthStore()
  
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setErrorMessage('No verification token provided')
        return
      }

      try {
        await authService.verifyEmail(token)
        setStatus('success')
        // Refresh user data (force refresh to get updated is_verified)
        await checkAuth(true)
        
        // Check if user has completed onboarding
        try {
          const [profile] = await profileService.getUserProfile()
          setIsOnboarded(profile?.is_onboarded ?? false)
        } catch {
          setIsOnboarded(false)
        }
        
        toast({
          title: 'Email verified!',
          description: 'Your account is now fully activated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } catch (error: any) {
        if (error.message?.includes('expired')) {
          setStatus('expired')
          setErrorMessage('Verification link has expired')
        } else {
          setStatus('error')
          setErrorMessage(error.message || 'Verification failed')
        }
      }
    }

    verifyEmail()
  }, [token, checkAuth, toast])

  const handleResend = async () => {
    if (!user?.email) {
      toast({
        title: 'Please login first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      navigate('/login')
      return
    }

    try {
      await authService.resendVerificationEmail(user.email)
      toast({
        title: 'New verification email sent!',
        description: 'Please check your inbox.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      toast({
        title: 'Failed to resend email',
        description: error.message || 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Spinner size="xl" color="yellow.500" thickness="4px" />
            <VStack spacing={3}>
              <Heading size="lg" fontWeight="600">
                Verifying your email...
              </Heading>
              <Text color="gray.600">Please wait a moment</Text>
            </VStack>
          </>
        )

      case 'success':
        return (
          <>
            <Box
              bg="green.50"
              borderRadius="full"
              p={6}
              border="4px solid"
              borderColor="green.200"
            >
              <Icon as={MdCheckCircle} boxSize={16} color="green.500" />
            </Box>
            <VStack spacing={3}>
              <Heading size="lg" fontWeight="600" color="green.600">
                Email Verified!
              </Heading>
              <Text color="gray.600" maxW="300px">
                {isOnboarded 
                  ? 'Your email has been successfully verified. You can now access all features.'
                  : 'Your email has been verified! Let\'s set up your profile to get started.'}
              </Text>
            </VStack>
            <Button
              bg="#ECC94B"
              color="black"
              w="full"
              h="52px"
              fontSize="lg"
              fontWeight="600"
              _hover={{ bg: '#D69E2E' }}
              onClick={() => navigate(isOnboarded ? '/dashboard' : '/onboarding')}
              isDisabled={isOnboarded === null}
            >
              {isOnboarded === null ? 'Loading...' : isOnboarded ? 'Go to Dashboard' : 'Set Up Profile'}
            </Button>
          </>
        )

      case 'expired':
        return (
          <>
            <Box
              bg="orange.50"
              borderRadius="full"
              p={6}
              border="4px solid"
              borderColor="orange.200"
            >
              <Icon as={MdError} boxSize={16} color="orange.500" />
            </Box>
            <VStack spacing={3}>
              <Heading size="lg" fontWeight="600" color="orange.600">
                Link Expired
              </Heading>
              <Text color="gray.600" maxW="300px">
                This verification link has expired. Please request a new one.
              </Text>
            </VStack>
            <VStack spacing={3} w="full">
              <Button
                leftIcon={<MdRefresh />}
                bg="#ECC94B"
                color="black"
                w="full"
                h="52px"
                fontSize="lg"
                fontWeight="600"
                _hover={{ bg: '#D69E2E' }}
                onClick={handleResend}
              >
                Send New Verification Email
              </Button>
              <Button
                variant="ghost"
                color="gray.600"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </VStack>
          </>
        )

      case 'error':
      default:
        return (
          <>
            <Box
              bg="red.50"
              borderRadius="full"
              p={6}
              border="4px solid"
              borderColor="red.200"
            >
              <Icon as={MdError} boxSize={16} color="red.500" />
            </Box>
            <VStack spacing={3}>
              <Heading size="lg" fontWeight="600" color="red.600">
                Verification Failed
              </Heading>
              <Text color="gray.600" maxW="300px">
                {errorMessage || 'Something went wrong. Please try again.'}
              </Text>
            </VStack>
            <VStack spacing={3} w="full">
              <Button
                leftIcon={<MdRefresh />}
                bg="#ECC94B"
                color="black"
                w="full"
                h="52px"
                fontSize="lg"
                fontWeight="600"
                _hover={{ bg: '#D69E2E' }}
                onClick={handleResend}
              >
                Resend Verification Email
              </Button>
              <Button
                variant="ghost"
                color="gray.600"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </VStack>
          </>
        )
    }
  }

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} minH="100vh" bg="white">
      <Flex align="center" justify="center" py={{ base: 12, md: 0 }}>
        <VStack spacing={8} w="full" maxW="420px" px={6} textAlign="center">
          <Stack direction="row" spacing={3} align="center">
            <Image src="/hive-logo.png" alt="The Hive" boxSize="65px" borderRadius="16px" />
            <Heading fontFamily="Urbanist, sans-serif" fontSize="40px" fontWeight="600">
              The Hive
            </Heading>
          </Stack>

          {renderContent()}
        </VStack>
      </Flex>

      <AuthIllustration />
    </Grid>
  )
}

export default VerifyEmailPage

