import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
  VStack,
  useToast,
  Icon,
} from '@chakra-ui/react'
import { MdEmail, MdRefresh } from 'react-icons/md'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import AuthIllustration from '@/components/AuthIllustration'
import { authService } from '@/services/auth.service'

const VerifyEmailSentPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const [isResending, setIsResending] = useState(false)

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

    setIsResending(true)
    try {
      await authService.resendVerificationEmail(user.email)
      toast({
        title: 'Verification email sent!',
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
    } finally {
      setIsResending(false)
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

          <Box
            bg="yellow.50"
            borderRadius="full"
            p={6}
            border="4px solid"
            borderColor="yellow.200"
          >
            <Icon as={MdEmail} boxSize={16} color="yellow.500" />
          </Box>

          <VStack spacing={3}>
            <Heading size="lg" fontWeight="600">
              Check your email
            </Heading>
            <Text color="gray.600" fontSize="md" maxW="300px">
              We've sent a verification link to{' '}
              <Text as="span" fontWeight="600" color="gray.800">
                {user?.email || 'your email'}
              </Text>
            </Text>
          </VStack>

          <VStack spacing={4} w="full">
            <Button
              leftIcon={<MdRefresh />}
              variant="outline"
              colorScheme="yellow"
              onClick={handleResend}
              isLoading={isResending}
              loadingText="Sending..."
              w="full"
              h="48px"
            >
              Resend verification email
            </Button>

            <Button
              variant="ghost"
              color="gray.600"
              onClick={() => navigate('/onboarding')}
              w="full"
            >
              Skip to Onboarding
            </Button>
          </VStack>

          <Text fontSize="sm" color="gray.500">
            Didn't receive the email? Check your spam folder or{' '}
            <Text
              as="span"
              color="blue.500"
              cursor="pointer"
              onClick={handleResend}
              _hover={{ textDecoration: 'underline' }}
            >
              click here to resend
            </Text>
          </Text>
        </VStack>
      </Flex>

      <AuthIllustration /
      >
    </Grid>
  )
}

export default VerifyEmailSentPage

