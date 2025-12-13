import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Link as ChakraLink,
  List,
  ListIcon,
  ListItem,
  Progress,
  Stack,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons'
import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import AuthIllustration from '@/components/AuthIllustration'

interface PasswordValidation {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
}

const validatePassword = (password: string): PasswordValidation => ({
  minLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
})

const getPasswordStrength = (validation: PasswordValidation): number => {
  const checks = [validation.minLength, validation.hasUppercase, validation.hasLowercase, validation.hasNumber]
  return (checks.filter(Boolean).length / checks.length) * 100
}

const getPasswordStrengthColor = (strength: number): string => {
  if (strength < 50) return 'red'
  if (strength < 75) return 'orange'
  if (strength < 100) return 'yellow'
  return 'green'
}

const SignupPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { register, isLoading } = useAuthStore()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPasswordHints, setShowPasswordHints] = useState(false)

  const passwordValidation = useMemo(() => validatePassword(formData.password), [formData.password])
  const passwordStrength = useMemo(() => getPasswordStrength(passwordValidation), [passwordValidation])
  const isPasswordValid = passwordStrength === 100

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!formData.firstName.trim()) {
      toast({ title: 'Please enter your first name', status: 'warning', duration: 3000, isClosable: true })
      return
    }
    if (!formData.lastName.trim()) {
      toast({ title: 'Please enter your last name', status: 'warning', duration: 3000, isClosable: true })
      return
    }
    if (!isPasswordValid) {
      toast({ title: 'Password does not meet requirements', status: 'error', duration: 3000, isClosable: true })
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Passwords do not match', status: 'error', duration: 3000, isClosable: true })
      return
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        check_password: formData.confirmPassword,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
      })
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      navigate('/verify-email-sent')
    } catch (error: any) {
      const errorMessage = error.errors 
        ? error.errors.join(', ') 
        : error.message || 'Something went wrong'
      toast({
        title: 'Registration failed',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} minH="100vh" bg="white">
      <Flex align="center" justify="center" py={{ base: 12, md: 0 }}>
        <VStack spacing={6} w="full" maxW="420px" px={6}>
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
              <VStack spacing={4}>
                <HStack spacing={3} w="full">
                  <FormControl isRequired>
                    <Stack spacing={1}>
                      <FormLabel fontSize="sm" fontWeight="600">
                        First Name
                      </FormLabel>
                      <Input
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        h="48px"
                        fontSize="md"
                        borderColor="gray.200"
                        borderRadius="md"
                      />
                    </Stack>
                  </FormControl>

                  <FormControl isRequired>
                    <Stack spacing={1}>
                      <FormLabel fontSize="sm" fontWeight="600">
                        Last Name
                      </FormLabel>
                      <Input
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        h="48px"
                        fontSize="md"
                        borderColor="gray.200"
                        borderRadius="md"
                      />
                    </Stack>
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <Stack spacing={1}>
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
                  <Stack spacing={1}>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Password
                    </FormLabel>
                    <InputGroup size="md">
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setShowPasswordHints(true)}
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
                    
                    {showPasswordHints && formData.password && (
                      <Box mt={2}>
                        <Progress 
                          value={passwordStrength} 
                          size="xs" 
                          colorScheme={getPasswordStrengthColor(passwordStrength)}
                          borderRadius="full"
                          mb={2}
                        />
                        <List spacing={1} fontSize="xs">
                          <ListItem color={passwordValidation.minLength ? 'green.500' : 'gray.500'}>
                            <ListIcon as={passwordValidation.minLength ? CheckCircleIcon : WarningIcon} />
                            At least 8 characters
                          </ListItem>
                          <ListItem color={passwordValidation.hasUppercase ? 'green.500' : 'gray.500'}>
                            <ListIcon as={passwordValidation.hasUppercase ? CheckCircleIcon : WarningIcon} />
                            One uppercase letter
                          </ListItem>
                          <ListItem color={passwordValidation.hasLowercase ? 'green.500' : 'gray.500'}>
                            <ListIcon as={passwordValidation.hasLowercase ? CheckCircleIcon : WarningIcon} />
                            One lowercase letter
                          </ListItem>
                          <ListItem color={passwordValidation.hasNumber ? 'green.500' : 'gray.500'}>
                            <ListIcon as={passwordValidation.hasNumber ? CheckCircleIcon : WarningIcon} />
                            One number
                          </ListItem>
                        </List>
                      </Box>
                    )}
                  </Stack>
                </FormControl>

                <FormControl isRequired>
                  <Stack spacing={1}>
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
                        borderColor={
                          formData.confirmPassword
                            ? formData.password === formData.confirmPassword
                              ? 'green.300'
                              : 'red.300'
                            : 'gray.200'
                        }
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
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <Text fontSize="xs" color="red.500">
                        Passwords do not match
                      </Text>
                    )}
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
                  isDisabled={!isPasswordValid || formData.password !== formData.confirmPassword}
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
