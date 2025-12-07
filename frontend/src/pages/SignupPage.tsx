import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Link as ChakraLink,
  Stack,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import AuthIllustration from '@/components/AuthIllustration'

const SignupPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { register, isLoading } = useAuthStore()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.fullName.trim()) {
      toast({ title: 'Please enter your full name', status: 'warning', duration: 3000, isClosable: true })
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Passwords do not match', status: 'error', duration: 3000, isClosable: true })
      return
    }

    const [firstName, ...rest] = formData.fullName.trim().split(/\s+/)
    const lastName = rest.join(' ') || firstName

    try {
      await register({
        email: formData.email,
        password: formData.password,
        check_password: formData.confirmPassword,
        first_name: firstName,
        last_name: lastName,
      })
      toast({
        title: 'Welcome to The Hive!',
        description: "Let's set up your profile.",
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      navigate('/onboarding')
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Something went wrong',
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
              variant="ghost"
              color="#1A202C"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              w="full"
              borderRadius="full"
              bg="#FAF089"
              color="#2C5282"
              fontWeight="600"
              _hover={{ bg: '#F6E05E' }}
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
                      Full Name
                    </FormLabel>
                    <Input
                      name="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
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
                      Email
                    </FormLabel>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
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
                    <InputGroup size="md">
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        h="48px"
                        fontSize="md"
                        borderColor="gray.200"
                        borderRadius="md"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          variant="ghost"
                          size="sm"
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPassword((prev) => !prev)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </Stack>
                </FormControl>

                <FormControl isRequired>
                  <Stack spacing={2}>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Confirm Password
                    </FormLabel>
                    <InputGroup size="md">
                      <Input
                        name="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Enter your password again"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        h="48px"
                        fontSize="md"
                        borderColor="gray.200"
                        borderRadius="md"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                          variant="ghost"
                          size="sm"
                          icon={showConfirm ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowConfirm((prev) => !prev)}
                        />
                      </InputRightElement>
                    </InputGroup>
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
                  loadingText="Creating account..."
                >
                  Sign Up
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

export default SignupPage
