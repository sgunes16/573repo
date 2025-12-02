import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { offerService } from '@/services/offer.service'
import { mapboxService } from '@/services/mapbox.service'
import { getUserBadge, mockCurrentUser } from '@/services/mock/mockData'
import type { Offer } from '@/types'
import { MdAccessTime, MdCalendarToday, MdChat, MdHandshake, MdLocationPin, MdPeople, MdSchedule } from 'react-icons/md'

const statusSteps = [
  { label: 'Handshake Request Sent', state: 'done' },
  { label: 'Chat Started', state: 'done' },
  { label: 'Waiting Request Approval', state: 'active' },
  { label: 'Time Freeze', state: 'upcoming' },
  { label: 'Offer Completed', state: 'upcoming' },
]

const HandshakePage = () => {
  const { offerId } = useParams<{ offerId: string }>()
  const [offer, setOffer] = useState<Offer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locationAddress, setLocationAddress] = useState<string>('')

  const requester = mockCurrentUser
  const provider = offer?.user
  const providerBadge = getUserBadge(provider?.profile?.time_credits || 0)

  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'provider', text: `Hi! Thanks for your interest.` },
    { id: '2', sender: 'requester', text: 'I would love to confirm the next available slot.' },
    { id: '3', sender: 'provider', text: 'Let me check my calendar real quick.' },
  ])

  useEffect(() => {
    const fetchOffer = async () => {
      if (!offerId) return
      
      setIsLoading(true)
      try {
        const data = await offerService.getOfferById(offerId)
        setOffer(data)
        
        // Fetch location address
        if (data.geo_location && data.geo_location.length === 2) {
          const address = await mapboxService.reverseGeocode(
            data.geo_location[0],
            data.geo_location[1]
          )
          setLocationAddress(address)
        } else if (data.location) {
          setLocationAddress(data.location)
        }
      } catch (error) {
        console.error('Failed to fetch offer:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOffer()
  }, [offerId])

  const sendMessage = () => {
    if (!message.trim()) return
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'requester', text: message }])
    setMessage('')
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('tr-TR')
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'TBD'
    return timeStr
  }

  const getActivityTypeLabel = (type?: string) => {
    return type === 'group' ? 'Group' : '1 to 1'
  }

  const getLocationTypeLabel = () => {
    if (offer?.location_type === 'remote') return 'Remote / Online'
    return locationAddress || offer?.location || 'TBD'
  }

  if (isLoading) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Navbar showUserInfo={true} />
        <Container maxW="1440px" px={{ base: 4, lg: 8 }} py={10}>
          <Grid templateColumns={{ base: '1fr', xl: '480px 1fr' }} gap={6}>
            <GridItem>
              <Stack spacing={6}>
                <Box bg="#E2E8F0" p={6} borderRadius="xl">
                  <Skeleton height="24px" width="150px" mb={4} />
                  <SkeletonText noOfLines={4} spacing={4} />
                </Box>
                <Box bg="#E2E8F0" p={6} borderRadius="xl">
                  <Skeleton height="24px" width="120px" mb={4} />
                  <HStack spacing={4} mb={4}>
                    <SkeletonCircle size="12" />
                    <SkeletonText noOfLines={2} width="150px" />
                  </HStack>
                </Box>
              </Stack>
            </GridItem>
            <GridItem>
              <Box bg="#E2E8F0" p={6} borderRadius="xl">
                <Skeleton height="400px" />
              </Box>
            </GridItem>
          </Grid>
        </Container>
      </Box>
    )
  }

  if (!offer || !provider) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Navbar showUserInfo={true} />
        <Container maxW="container.md" py={20} textAlign="center">
          <Text fontSize="xl" fontWeight="semibold">Offer not found.</Text>
          <Text color="gray.600">Please go back to the dashboard and pick another offer.</Text>
        </Container>
      </Box>
    )
  }

  return (
    <Box bg="gray.50" minH="100vh">
      <Navbar showUserInfo={true} />
      <Container maxW="1440px" px={{ base: 4, lg: 8 }} py={10}>
        <Grid templateColumns={{ base: '1fr', xl: '480px 1fr' }} gap={6} alignItems="flex-start">
          <GridItem>
            <Stack spacing={6}>
              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Text fontSize="lg" fontWeight="700" mb={4}>
                  {offer.type === 'offer' ? 'Offer' : 'Want'} Overview
                </Text>
                <Stack spacing={4}>
                  <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
                    <Box>
                      <Text fontSize="xl" fontWeight="700">{offer.title}</Text>
                      <Badge 
                        colorScheme={offer.type === 'offer' ? 'green' : 'blue'} 
                        mt={1}
                      >
                        {offer.type === 'offer' ? '🤝 Offer' : '🙋 Want'}
                      </Badge>
                    </Box>
                    <HStack spacing={2} flexWrap="wrap">
                      <Badge bg="yellow.50" color="yellow.700" px={2} py={1} borderRadius="md">
                        ⭐ {provider.profile?.rating?.toFixed(1) ?? '0.0'}
                      </Badge>
                      <Badge colorScheme={providerBadge.color as any} variant="subtle" textTransform="uppercase">
                        {providerBadge.label}
                      </Badge>
                      <Badge bg="yellow.100" color="yellow.800" px={2} py={1} borderRadius="md">
                        {provider.profile?.time_credits ?? 0}H
                      </Badge>
                      <Avatar size="sm" name={`${provider.first_name} ${provider.last_name}`} />
                    </HStack>
                  </Flex>

                  {/* Description */}
                  {offer.description && (
                    <Box bg="white" p={3} borderRadius="lg">
                      <Text fontSize="sm" color="gray.700" noOfLines={3}>
                        {offer.description}
                      </Text>
                    </Box>
                  )}

                  {/* Tags */}
                  {offer.tags && offer.tags.length > 0 && (
                    <HStack spacing={2} flexWrap="wrap">
                      {offer.tags.map((tag) => (
                        <Badge key={tag} colorScheme="gray" variant="subtle">
                          #{tag}
                        </Badge>
                      ))}
                    </HStack>
                  )}

                  <Divider />

                  <VStack align="stretch" spacing={3} fontSize="sm">
                    <HStack justify="space-between">
                      <Text fontWeight="600">Date</Text>
                      <HStack>
                        <Icon as={MdCalendarToday} />
                        <Text>{formatDate(offer.date)}</Text>
                      </HStack>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="600">Time</Text>
                      <HStack>
                        <Icon as={MdSchedule} />
                        <Text>{formatTime(offer.time)}</Text>
                      </HStack>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="600">Location</Text>
                      <HStack>
                        <Icon as={MdLocationPin} />
                        <Text noOfLines={1} maxW="200px">{getLocationTypeLabel()}</Text>
                      </HStack>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="600">Details</Text>
                      <HStack spacing={3} color="gray.700">
                        <HStack spacing={1}>
                          <Icon as={MdAccessTime} />
                          <Text>{offer.time_required} hr</Text>
                        </HStack>
                        <HStack spacing={1}>
                          <Icon as={MdPeople} />
                          <Text>{getActivityTypeLabel(offer.activity_type)}</Text>
                        </HStack>
                        {offer.activity_type === 'group' && (
                          <Text>({offer.person_count} ppl)</Text>
                        )}
                      </HStack>
                    </HStack>
                  </VStack>
                </Stack>
              </Box>

              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Text fontSize="lg" fontWeight="700" mb={4}>Participants</Text>
                <VStack align="stretch" spacing={4}>
                  {[
                    { label: offer.type === 'offer' ? 'Provider' : 'Requester', user: provider },
                    { label: offer.type === 'offer' ? 'Requester' : 'Helper', user: requester }
                  ].map((entry) => (
                    <Flex key={entry.label} align="center" justify="space-between">
                      <HStack spacing={4}>
                        <Avatar name={`${entry.user.first_name} ${entry.user.last_name}`} src={entry.user.profile?.profile_picture} />
                        <Box>
                          <Text fontWeight="600">{entry.user.first_name} {entry.user.last_name}</Text>
                          <Text fontSize="sm" color="gray.600">{entry.label}</Text>
                        </Box>
                      </HStack>
                      <Badge colorScheme={entry.label === 'Provider' || entry.label === 'Requester' ? 'green' : 'blue'}>
                        {entry.label}
                      </Badge>
                    </Flex>
                  ))}
                </VStack>
              </Box>

              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Text fontSize="lg" fontWeight="700" mb={4}>Handshake Progress</Text>
                <VStack align="stretch" spacing={3}>
                  {statusSteps.map((step) => (
                    <Flex
                      key={step.label}
                      bg={step.state === 'done' ? '#FAF089' : step.state === 'active' ? '#FEEBC8' : '#FFFFF0'}
                      p={3}
                      borderRadius="lg"
                      align="center"
                      justify="space-between"
                    >
                      <Text fontWeight="600" fontSize="sm">{step.label}</Text>
                      {step.state === 'done' && <Icon as={MdHandshake} color="green.600" />}
                      {step.state === 'active' && <Icon as={MdChat} color="orange.500" />}
                      {step.state === 'upcoming' && <Icon as={MdAccessTime} color="gray.500" />}
                    </Flex>
                  ))}
                </VStack>
              </Box>
            </Stack>
          </GridItem>

          <GridItem>
            <Stack spacing={6} h="100%">
              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Flex align="center" justify="space-between" mb={6}>
                  <Box>
                    <Text fontSize="lg" fontWeight="700">Handshake Chat</Text>
                    <Text color="gray.600" fontSize="sm">Coordinate the final details before freezing time.</Text>
                  </Box>
                  <HStack spacing={3}>
                    <Badge bg="purple.100" color="purple.700" px={3} py={1} borderRadius="full">Secure</Badge>
                    <Badge bg="yellow.100" color="yellow.800" px={3} py={1} borderRadius="full">Time Bank</Badge>
                  </HStack>
                </Flex>

                <VStack flex={1} spacing={4} align="stretch" maxH="540px" overflowY="auto" mb={4}>
                  {chatMessages.map((msg) => (
                    <Flex key={msg.id} justify={msg.sender === 'requester' ? 'flex-end' : 'flex-start'}>
                      <HStack spacing={2} align="flex-start">
                        {msg.sender === 'provider' && <Avatar size="sm" name={provider.first_name} />}
                        <Box
                          bg={msg.sender === 'requester' ? '#F6AD55' : '#4A5568'}
                          color="white"
                          px={4}
                          py={3}
                          borderRadius="xl"
                          maxW="440px"
                        >
                          <Text fontSize="sm">{msg.text}</Text>
                        </Box>
                        {msg.sender === 'requester' && <Avatar size="sm" name={requester.first_name} />}
                      </HStack>
                    </Flex>
                  ))}
                </VStack>

                <HStack spacing={3}>
                  <Input
                    placeholder="Enter a message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                    bg="#FFFFF0"
                    borderColor="gray.300"
                    borderRadius="full"
                    h="48px"
                  />
                  <Button
                    bg="#F6AD55"
                    color="white"
                    h="48px"
                    px={8}
                    borderRadius="full"
                    onClick={sendMessage}
                    _hover={{ bg: '#ED8936' }}
                  >
                    Send
                  </Button>
                </HStack>
              </Box>

              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Text fontSize="lg" fontWeight="700" mb={4}>Next Steps</Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
                  {[
                    { icon: MdCalendarToday, label: 'Proposed Date', value: formatDate(offer.date) },
                    { icon: MdSchedule, label: 'Proposed Time', value: formatTime(offer.time) },
                    { icon: MdPeople, label: 'Activity Type', value: getActivityTypeLabel(offer.activity_type) },
                  ].map((item) => (
                    <Box key={item.label} bg="white" borderRadius="lg" p={3} textAlign="center">
                      <Icon as={item.icon} color="#975A16" mb={2} />
                      <Text fontSize="sm" color="gray.600">{item.label}</Text>
                      <Text fontWeight="600">{item.value}</Text>
                    </Box>
                  ))}
                </Grid>
              </Box>
            </Stack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  )
}

export default HandshakePage
