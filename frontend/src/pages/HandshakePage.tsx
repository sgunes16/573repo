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
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { mockOffers, getUserBadge, mockCurrentUser } from '@/services/mock/mockData'
import { MdAccessTime, MdCalendarToday, MdChat, MdHandshake, MdLocationPin, MdPeople, MdSchedule } from 'react-icons/md'

const statusSteps = [
  { label: 'Handshake Request Sent', state: 'done' },
  { label: 'Chat Started', state: 'done' },
  { label: 'Waiting Request Approval', state: 'active' },
  { label: 'Time Freeze', state: 'upcoming' },
  { label: 'Offer Completed', state: 'upcoming' },
]

const offerMeta = {
  '1': { date: '11.11.2025', start: '08:00', cadence: '1-time', duration: '1 hr.', group: '1 to 1', location: 'Hisarüstü, Beşiktaş' },
  '2': { date: '20.11.2025', start: '09:30', cadence: 'Daily', duration: '1 hr.', group: '4 person', location: 'Bebek, Beşiktaş' },
  '3': { date: '20.11.2025', start: '18:00', cadence: 'Bi-weekly', duration: '2 hr.', group: '2 person', location: 'İzmit' },
  '4': { date: '12.12.2025', start: '15:30', cadence: '1-time', duration: '1 hr.', group: '1 to 1', location: 'Aşiyan, Beşiktaş' },
  '5': { date: '21.12.2025', start: '16:00', cadence: '1-time', duration: '1 hr.', group: '8 person', location: 'Remote' },
  '6': { date: '11.11.2025', start: '07:00', cadence: 'Bi-daily', duration: '1 hr.', group: '1 to 1', location: 'İstinye, Sarıyer' },
  '7': { date: '11.11.2025', start: '11:00', cadence: 'Daily', duration: '1 hr.', group: '1 to 1', location: 'Sarıyer' },
} as const

const HandshakePage = () => {
  const { offerId } = useParams<{ offerId: string }>()
  const offer = useMemo(() => mockOffers.find((item) => item.id === offerId), [offerId])
  const meta = offerMeta[offer?.id as keyof typeof offerMeta] ?? {
    date: new Date().toLocaleDateString(),
    start: '08:00',
    cadence: '1-time',
    duration: '1 hr.',
    group: '1 to 1',
    location: offer?.location ?? 'TBD',
  }

  const provider = offer?.user
  const requester = mockCurrentUser
  const providerBadge = getUserBadge(provider?.profile?.time_credits || 0)

  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'provider', text: `Hi! Thanks for your interest.` },
    { id: '2', sender: 'requester', text: 'I would love to confirm the next available slot.' },
    { id: '3', sender: 'provider', text: 'Let me check my calendar real quick.' },
  ])

  const sendMessage = () => {
    if (!message.trim()) return
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'requester', text: message }])
    setMessage('')
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
                  Offer Overview
                </Text>
                <Stack spacing={4}>
                  <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
                    <Box>
                      <Text fontSize="xl" fontWeight="700">{offer.title}</Text>
                      <Text color="gray.600">{offer.type === 'offer' ? 'Offer' : 'Want'}</Text>
                    </Box>
                    <HStack spacing={2} flexWrap="wrap">
                      <Badge bg="yellow.50" color="yellow.700" px={2} py={1} borderRadius="md">
                        ⭐ {provider.profile?.rating?.toFixed(1) ?? '4.5'}
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

                  <Divider />

                  <VStack align="stretch" spacing={3} fontSize="sm">
                    <HStack justify="space-between">
                      <Text fontWeight="600">Date</Text>
                      <HStack>
                        <Icon as={MdCalendarToday} />
                        <Text>{meta.date}</Text>
                      </HStack>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="600">Start</Text>
                      <HStack>
                        <Icon as={MdSchedule} />
                        <Text>{meta.start}</Text>
                      </HStack>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="600">Location</Text>
                      <HStack>
                        <Icon as={MdLocationPin} />
                        <Text>{meta.location}</Text>
                      </HStack>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="600">Offer Type</Text>
                      <HStack spacing={3} color="gray.700">
                        <HStack spacing={1}><Icon as={MdAccessTime} /><Text>{meta.cadence}</Text></HStack>
                        <HStack spacing={1}><Icon as={MdSchedule} /><Text>{meta.duration}</Text></HStack>
                        <HStack spacing={1}><Icon as={MdPeople} /><Text>{meta.group}</Text></HStack>
                      </HStack>
                    </HStack>
                  </VStack>
                </Stack>
              </Box>

              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Text fontSize="lg" fontWeight="700" mb={4}>Participants</Text>
                <VStack align="stretch" spacing={4}>
                  {[{ label: 'Provider', user: provider }, { label: 'Requester', user: requester }].map((entry) => (
                    <Flex key={entry.label} align="center" justify="space-between">
                      <HStack spacing={4}>
                        <Avatar name={`${entry.user.first_name} ${entry.user.last_name}`} src={entry.user.profile?.profile_picture} />
                        <Box>
                          <Text fontWeight="600">{entry.user.first_name} {entry.user.last_name}</Text>
                          <Text fontSize="sm" color="gray.600">{entry.label}</Text>
                        </Box>
                      </HStack>
                      <Badge colorScheme={entry.label === 'Provider' ? 'green' : 'blue'}>{entry.label}</Badge>
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
                    { icon: MdCalendarToday, label: 'Proposed Date', value: meta.date },
                    { icon: MdSchedule, label: 'Proposed Time', value: `${meta.start} (${meta.duration})` },
                    { icon: MdPeople, label: 'Participants', value: meta.group },
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
