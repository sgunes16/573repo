import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import {
  MdOutlineSavings,
  MdOutlineVolunteerActivism,
  MdOutlineFrontHand,
} from 'react-icons/md'
import Navbar from '@/components/Navbar'

const heroImage = 'http://localhost:3845/assets/b01aa748e752a3c10400d96dcc22b5ff015374d8.png'

const howItWorks = [
  {
    icon: MdOutlineVolunteerActivism,
    title: 'Offer Your Skills',
    description:
      'Publish what you love to do—from piano lessons to pet care—and make it available to your neighbors.',
  },
  {
    icon: MdOutlineSavings,
    title: 'Earn Time Credits',
    description:
      'Every hour you give becomes a credit in The Hive TimeBank, ready to spend on services you need.',
  },
  {
    icon: MdOutlineFrontHand,
    title: 'Receive Support',
    description:
      'Use your credits to request help from other members, knowing every exchange is community-backed.',
  },
]

const highlights = [
  { label: 'Active Members', value: '12K+' },
  { label: 'Offers Listed', value: '4.3K' },
  { label: 'Hours Shared', value: '89K' },
]

const values = [
  {
    title: 'Inclusive Community',
    description: 'Everyone has something to offer. We focus on strengths, not titles.',
  },
  {
    title: 'Transparent Exchange',
    description: 'Time is the only currency. One hour of mentoring equals one hour of tutoring.',
  },
  {
    title: 'Local Impact',
    description: 'Contributions stay close to home and directly strengthen your neighborhood.',
  },
]

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={false} />

      {/* Hero */}
      <Container maxW="1440px" px={{ base: 4, md: 8 }} py={12}>
        <Stack spacing={10}>
          <Box borderRadius="2xl" overflow="hidden" boxShadow="lg">
            <Image src={heroImage} alt="Community joining hands" w="full" h={{ base: '240px', md: '400px' }} objectFit="cover" />
          </Box>
          <VStack spacing={6} textAlign="center">
            <Heading fontFamily="Urbanist, sans-serif" fontSize={{ base: '3xl', md: '5xl' }} fontWeight="700" lineHeight="1.2">
              Your community. Your time. Your skills.
            </Heading>
            <Text fontSize={{ base: 'lg', md: '2xl' }} maxW="960px">
              The Hive is a neighborhood time bank where generosity circulates. Give an hour of what you do best and receive an hour of the support you need.
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              <Button size="lg" px={10} bg="#ECC94B" color="black" _hover={{ bg: '#D69E2E' }} onClick={() => navigate('/dashboard')}>
                Browse Offers & Wants
              </Button>
              <Button size="lg" px={10} variant="outline" borderColor="#B7791F" color="#B7791F" onClick={() => navigate('/signup')}>
                Join The Hive
              </Button>
            </Stack>
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {highlights.map((item) => (
              <Box key={item.label} bg="#EDF2F7" borderRadius="lg" p={6} textAlign="center">
                <Text fontSize="3xl" fontWeight="700" color="#B7791F">
                  {item.value}
                </Text>
                <Text fontSize="md" color="gray.600">
                  {item.label}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      {/* How It Works Section */}
      <Container maxW="1440px" px={{ base: 4, md: 8 }} py={16}>
        <VStack spacing={10}>
          <VStack spacing={3} textAlign="center">
            <Text fontSize="md" letterSpacing="0.3em" color="#B7791F">
              HOW IT WORKS
            </Text>
            <Heading fontSize={{ base: '3xl', md: '4xl' }}>A simple way to exchange services</Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.700" maxW="960px">
              Getting started is easy. Follow the steps below and watch your neighborhood strengthen with every hour traded.
            </Text>
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
            {howItWorks.map((card) => (
              <VStack key={card.title} bg="#EDF2F7" p={8} borderRadius="xl" align="flex-start" spacing={4} boxShadow="md">
                <Icon as={card.icon} boxSize={10} color="#22543D" />
                <Heading size="md">{card.title}</Heading>
                <Text color="gray.700">{card.description}</Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      {/* Why Section */}
      <Container maxW="1440px" px={{ base: 4, md: 8 }} py={16}>
        <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={10} alignItems="center">
          <VStack align="flex-start" spacing={6}>
            <Text fontSize="md" letterSpacing="0.3em" color="#B7791F">
              WHY THE HIVE
            </Text>
            <Heading fontSize={{ base: '3xl', md: '4xl' }}>Exchange more than hours—build belonging.</Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.700">
              Every interaction is a handshake between neighbors. With verified members and transparent credits, you can trust that the help you offer will come back when needed most.
            </Text>
            <VStack align="stretch" spacing={4}>
              {values.map((item) => (
                <Box key={item.title} bg="#F7FAFC" borderRadius="lg" p={4}>
                  <Text fontWeight="600">{item.title}</Text>
                  <Text color="gray.600">{item.description}</Text>
                </Box>
              ))}
            </VStack>
          </VStack>
          <VStack spacing={6}>
            <Avatar size="2xl" w="320px" h="340px" src="https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg" name="Selin" />
            <Text fontSize="xl" fontWeight="600" textAlign="center">
              “I taught piano for two hours and received help planning my garden. Time never felt this fair.”
            </Text>
            <Text color="gray.600">Selin · Design Student & Community Lead</Text>
          </VStack>
        </Grid>
      </Container>

      {/* CTA */}
      <Box bg="#ECC94B" py={12} borderTopRadius="2xl">
        <Container maxW="1440px" px={{ base: 4, md: 8 }}>
          <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={6}>
            <Box>
              <Heading fontSize={{ base: '2xl', md: '3xl' }}>Ready to trade time?</Heading>
              <Text color="gray.700">
                Create your account today and start exchanging support in your neighborhood.
              </Text>
            </Box>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              <Button size="lg" px={8} bg="white" color="black" onClick={() => navigate('/signup')}>
                Get Started
              </Button>
              <Button size="lg" px={8} variant="outline" borderColor="black" color="black" onClick={() => navigate('/login')}>
                Log In
              </Button>
            </Stack>
          </Flex>
          <Divider my={6} borderColor="rgba(0,0,0,0.3)" />
          <Flex justify="space-between" direction={{ base: 'column', md: 'row' }} gap={4}>
            <Text fontWeight="600">The Hive</Text>
            <Text>© {new Date().getFullYear()} The Hive Community. All rights reserved.</Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage
