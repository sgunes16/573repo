import { Box, Button, Heading, Text, VStack, Icon } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { MdHome, MdSearchOff } from 'react-icons/md'
import Navbar from '@/components/Navbar'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      <VStack
        spacing={6}
        justify="center"
        align="center"
        minH="calc(100vh - 56px)"
        px={4}
        py={12}
      >
        <Icon as={MdSearchOff} boxSize={20} color="gray.300" />
        <VStack spacing={2}>
          <Heading size="2xl" color="gray.700">404</Heading>
          <Heading size="md" color="gray.500" fontWeight="normal">
            Page Not Found
          </Heading>
        </VStack>
        <Text color="gray.500" textAlign="center" maxW="400px">
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button
          leftIcon={<Icon as={MdHome} />}
          colorScheme="yellow"
          size="lg"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </VStack>
    </Box>
  )
}

export default NotFoundPage

