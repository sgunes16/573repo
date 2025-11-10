import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Image,
  Input,
  Link as ChakraLink,
  Stack,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import AuthIllustration from '@/components/AuthIllustration'

const LoginPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { login, isLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login({ email, password })
      toast({
        title: 'Welcome back to The Hive!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      navigate('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} minH="100vh" bg="white">
      <Flex align="center" justify="center" py={{ base: 12, md: 0 }}>
        <VStack spacing={8} w="full" maxW="420px" px={6}>
          <Stack direction="row" spacing={3} align="center">
            <Image src="/hive-logo.png" alt="The Hive" boxSize="65px" borderRadius="16px" />
            <Heading fontFamily="Urbanist, sans-serif" fontSize="40px" fontWeight="600">
              The Hive
            </Heading>
          </Stack>

          <Stack
            direction="row"
            bg="#F9F9F9"
            borderRadius="full"
            p="4px"
            spacing={1}
            w="223px"
            justify="space-between"
          >
            <Button
              w="full"
              borderRadius="full"
              bg="#FAF089"
              color="#2C5282"
              fontWeight="600"
              _hover={{ bg: '#F6E05E' }}
            >
              Login
            </Button>
            <Button
              w="full"
              borderRadius="full"
              variant="ghost"
              color="#1A202C"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </Button>
          </Stack>

          <Box w="full">
            <form onSubmit={handleSubmit}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <Stack spacing={2}>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Email
                    </FormLabel>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      h="48px"
                      fontSize="md"
                      borderColor="gray.200"
                      borderRadius="md"
                    />
                  </Stack>
                </FormControl>

                <FormControl isRequired>
                  <Stack spacing={2}>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Password
                    </FormLabel>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      h="48px"
                      fontSize="md"
                      borderColor="gray.200"
                      borderRadius="md"
                    />
                  </Stack>
                </FormControl>

                <Button
                  type="submit"
                  bg="#ECC94B"
                  color="black"
                  w="full"
                  h="52px"
                  fontSize="lg"
                  fontWeight="600"
                  _hover={{ bg: '#D69E2E' }}
                  isLoading={isLoading}
                  loadingText="Logging in..."
                >
                  Login
                </Button>
                <ChakraLink
                  as={Link}
                  to="/forgot-password"
                  fontSize="sm"
                  fontWeight="600"
                  color="#2B6CB0"
                  textAlign="right"
                  w="full"
                >
                  Forgot Password?
                </ChakraLink>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Flex>

      <AuthIllustration />
    </Grid>
  )
}

export default LoginPage
