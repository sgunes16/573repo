import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { exchangeService } from '@/services/exchange.service'
import { mapboxService } from '@/services/mapbox.service'
import { getUserBadge } from '@/services/mock/mockData'
import { useAuthStore } from '@/store/useAuthStore'
import type { Exchange, ExchangeStatus, User, ExchangeRating } from '@/types'
import { 
  MdAccessTime, 
  MdCalendarToday, 
  MdChat, 
  MdHandshake, 
  MdLocationPin, 
  MdPeople, 
  MdSchedule,
  MdCheckCircle,
  MdCancel,
  MdStar,
} from 'react-icons/md'

const HandshakePage = () => {
  const { offerId } = useParams<{ offerId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const currentUser = user as unknown as User

  const [exchange, setExchange] = useState<Exchange | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locationAddress, setLocationAddress] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modals
  const { isOpen: isProposeOpen, onOpen: onProposeOpen, onClose: onProposeClose } = useDisclosure()
  const { isOpen: isRatingOpen, onOpen: onRatingOpen, onClose: onRatingClose } = useDisclosure()

  // Form states
  const [proposedDate, setProposedDate] = useState('')
  const [proposedTime, setProposedTime] = useState('')
  const [rating, setRating] = useState({
    communication: 5,
    punctuality: 5,
    would_recommend: true,
    comment: '',
  })

  // Chat (mock - will be implemented separately)
  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'provider', text: `Hi! Thanks for your interest.` },
    { id: '2', sender: 'requester', text: 'I would love to confirm the next available slot.' },
    { id: '3', sender: 'provider', text: 'Let me check my calendar real quick.' },
  ])

  useEffect(() => {
    const fetchExchange = async () => {
      if (!offerId) return
      
      setIsLoading(true)
      try {
        // Try to get existing exchange for this offer
        const existingExchange = await exchangeService.getExchangeByOfferId(offerId)

        if (existingExchange) {
          setExchange(existingExchange)
          
          // Fetch location address
          if (existingExchange.offer.geo_location && existingExchange.offer.geo_location.length === 2) {
            try {
              const address = await mapboxService.reverseGeocode(
                existingExchange.offer.geo_location[0],
                existingExchange.offer.geo_location[1]
              )
              setLocationAddress(address)
            } catch (error) {
              console.error('Failed to geocode:', error)
            }
          } else if (existingExchange.offer.location) {
            setLocationAddress(existingExchange.offer.location)
          }
        }
        // If no exchange found, it will show the "Request Exchange" button
      } catch (error) {
        console.error('Failed to fetch exchange:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExchange()
  }, [offerId])

  const isRequester = exchange?.requester.id === currentUser?.id
  const isProvider = exchange?.provider.id === currentUser?.id
  const otherUser = isRequester ? exchange?.provider : exchange?.requester

  const getStatusSteps = () => {
    if (!exchange) return []
    
    const steps = [
      { label: 'Request Sent', state: 'done' },
      { label: 'Chat', state: exchange.status !== 'PENDING' ? 'done' : 'active' },
      { label: 'Date Proposed', state: exchange.proposed_date ? 'done' : 'upcoming' },
      { label: 'Accepted', state: exchange.status === 'ACCEPTED' || exchange.status === 'COMPLETED' ? 'done' : 'upcoming' },
      { label: 'Completed', state: exchange.status === 'COMPLETED' ? 'done' : 'upcoming' },
    ]
    return steps
  }

  const handleCreateExchange = async () => {
    if (!offerId) return
    
    setIsSubmitting(true)
    try {
      const response = await exchangeService.createExchange({ offer_id: offerId })
      toast({
        title: 'Request sent!',
        description: '1H has been frozen. You can now chat and propose a date.',
        status: 'success',
        duration: 3000,
      })
      
      const newExchange = await exchangeService.getExchange(response.exchange_id.toString())
      setExchange(newExchange)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create exchange',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProposeDateTime = async () => {
    if (!exchange || !proposedDate) return

    setIsSubmitting(true)
    try {
      await exchangeService.proposeDateTime(exchange.id.toString(), {
        date: proposedDate,
        time: proposedTime || undefined,
      })
      
      const updatedExchange = await exchangeService.getExchange(exchange.id.toString())
      setExchange(updatedExchange)
      onProposeClose()
      toast({
        title: 'Date proposed!',
        description: 'Waiting for provider to accept.',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to propose date',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAccept = async () => {
    if (!exchange) return

    setIsSubmitting(true)
    try {
      await exchangeService.acceptExchange(exchange.id.toString())
      const updatedExchange = await exchangeService.getExchange(exchange.id.toString())
      setExchange(updatedExchange)
      toast({
        title: 'Exchange accepted!',
        description: 'You can now coordinate the details.',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to accept exchange',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!exchange) return

    setIsSubmitting(true)
    try {
      await exchangeService.rejectExchange(exchange.id.toString())
      toast({
        title: 'Exchange rejected',
        description: 'Time has been unfrozen.',
        status: 'info',
        duration: 3000,
      })
      navigate('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to reject exchange',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmCompletion = async () => {
    if (!exchange) return

    setIsSubmitting(true)
    try {
      await exchangeService.confirmCompletion(exchange.id.toString())
      const updatedExchange = await exchangeService.getExchange(exchange.id.toString())
      setExchange(updatedExchange)
      
      if (updatedExchange.status === 'COMPLETED') {
        toast({
          title: 'Exchange completed!',
          description: 'Please rate your experience.',
          status: 'success',
          duration: 3000,
        })
        onRatingOpen()
      } else {
        toast({
          title: 'Confirmation sent!',
          description: 'Waiting for the other party to confirm.',
          status: 'success',
          duration: 3000,
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to confirm completion',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitRating = async () => {
    if (!exchange) return

    setIsSubmitting(true)
    try {
      await exchangeService.submitRating(exchange.id.toString(), rating)
      const updatedExchange = await exchangeService.getExchange(exchange.id.toString())
      setExchange(updatedExchange)
      onRatingClose()
      toast({
        title: 'Rating submitted!',
        description: 'Thank you for your feedback.',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit rating',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendMessage = () => {
    if (!message.trim()) return
    setChatMessages((prev) => [...prev, { 
      id: Date.now().toString(), 
      sender: isRequester ? 'requester' : 'provider', 
      text: message 
    }])
    setMessage('')
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'TBD'
    return timeStr
  }

  const getActivityTypeLabel = (type?: string) => {
    return type === 'group' ? 'Group' : '1 to 1'
  }

  const getLocationTypeLabel = () => {
    if (offer?.location_type === 'remote' || offer?.location_type === 'otherLocation') return 'Remote / Online'
    return locationAddress || offer?.location || 'TBD'
  }

  const hasRated = () => {
    if (!exchange || !exchange.ratings) return false
    return exchange.ratings.some(r => r.rater_id === currentUser?.id)
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

  if (!exchange) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Navbar showUserInfo={true} />
        <Container maxW="container.md" py={20} textAlign="center">
          <Text fontSize="xl" fontWeight="semibold" mb={4}>No exchange found</Text>
          <Text color="gray.600" mb={6}>Create an exchange request to start the handshake process.</Text>
          <Button
            colorScheme="yellow"
            size="lg"
            onClick={handleCreateExchange}
            isLoading={isSubmitting}
          >
            Request Exchange
          </Button>
        </Container>
      </Box>
    )
  }

  const offer = exchange.offer
  const provider = exchange.provider
  const requester = exchange.requester
  const providerBadge = getUserBadge((provider.profile as any)?.time_credits || 0)
  const providerRating = (provider.profile as any)?.rating || 0

  return (
    <Box bg="gray.50" minH="100vh">
      <Navbar showUserInfo={true} />
      <Container maxW="1440px" px={{ base: 4, lg: 8 }} py={10}>
        <Grid templateColumns={{ base: '1fr', xl: '480px 1fr' }} gap={6} alignItems="flex-start">
          <GridItem>
            <Stack spacing={6}>
              {/* Offer Overview */}
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
                        ⭐ {providerRating.toFixed(1)}
                      </Badge>
                      <Badge colorScheme={providerBadge.color as any} variant="subtle" textTransform="uppercase">
                        {providerBadge.label}
                      </Badge>
                      <Avatar size="sm" name={`${provider.first_name} ${provider.last_name}`} src={(provider.profile as any)?.avatar} />
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
                    {offer.date && (
                      <HStack justify="space-between">
                        <Text fontWeight="600">Date</Text>
                        <HStack>
                          <Icon as={MdCalendarToday} />
                          <Text>{formatDate(offer.date)}</Text>
                        </HStack>
                      </HStack>
                    )}
                    {offer.time && (
                      <HStack justify="space-between">
                        <Text fontWeight="600">Time</Text>
                        <HStack>
                          <Icon as={MdSchedule} />
                          <Text>{formatTime(offer.time)}</Text>
                        </HStack>
                      </HStack>
                    )}
                    {exchange.proposed_date && (
                      <>
                        <HStack justify="space-between">
                          <Text fontWeight="600">Proposed Date</Text>
                          <HStack>
                            <Icon as={MdCalendarToday} />
                            <Text>{formatDate(exchange.proposed_date)}</Text>
                          </HStack>
                        </HStack>
                        {exchange.proposed_time && (
                          <HStack justify="space-between">
                            <Text fontWeight="600">Proposed Time</Text>
                            <HStack>
                              <Icon as={MdSchedule} />
                              <Text>{formatTime(exchange.proposed_time)}</Text>
                            </HStack>
                          </HStack>
                        )}
                      </>
                    )}
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
                        {offer.activity_type && (
                          <HStack spacing={1}>
                            <Icon as={MdPeople} />
                            <Text>{getActivityTypeLabel(offer.activity_type)}</Text>
                          </HStack>
                        )}
                        {offer.activity_type === 'group' && offer.person_count && (
                          <Text>({offer.person_count} ppl)</Text>
                        )}
                      </HStack>
                    </HStack>
                  </VStack>
                </Stack>
              </Box>

              {/* Participants */}
              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Text fontSize="lg" fontWeight="700" mb={4}>Participants</Text>
                <VStack align="stretch" spacing={4}>
                  <Flex align="center" justify="space-between">
                    <HStack spacing={4}>
                      <Avatar name={`${provider.first_name} ${provider.last_name}`} src={(provider.profile as any)?.avatar} />
                      <Box>
                        <Text fontWeight="600">{provider.first_name} {provider.last_name}</Text>
                        <Text fontSize="sm" color="gray.600">Provider</Text>
                      </Box>
                    </HStack>
                    <Badge colorScheme="green">Provider</Badge>
                  </Flex>
                  <Flex align="center" justify="space-between">
                    <HStack spacing={4}>
                      <Avatar name={`${requester.first_name} ${requester.last_name}`} src={(requester.profile as any)?.avatar} />
                      <Box>
                        <Text fontWeight="600">{requester.first_name} {requester.last_name}</Text>
                        <Text fontSize="sm" color="gray.600">Requester</Text>
                      </Box>
                    </HStack>
                    <Badge colorScheme="blue">Requester</Badge>
                  </Flex>
                </VStack>
              </Box>

              {/* Status Steps */}
              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Text fontSize="lg" fontWeight="700" mb={4}>Handshake Progress</Text>
                <VStack align="stretch" spacing={3}>
                  {getStatusSteps().map((step, idx) => (
                    <Flex
                      key={idx}
                      bg={step.state === 'done' ? '#FAF089' : step.state === 'active' ? '#FEEBC8' : '#FFFFF0'}
                      p={3}
                      borderRadius="lg"
                      align="center"
                      justify="space-between"
                    >
                      <Text fontWeight="600" fontSize="sm">{step.label}</Text>
                      {step.state === 'done' && <Icon as={MdCheckCircle} color="green.600" />}
                      {step.state === 'active' && <Icon as={MdChat} color="orange.500" />}
                      {step.state === 'upcoming' && <Icon as={MdAccessTime} color="gray.500" />}
                    </Flex>
                  ))}
                </VStack>
              </Box>

              {/* Action Buttons */}
              {exchange.status === 'PENDING' && isRequester && !exchange.proposed_date && (
                <Button colorScheme="yellow" onClick={onProposeOpen}>
                  Propose Date & Time
                </Button>
              )}
              
              {exchange.status === 'PENDING' && isProvider && exchange.proposed_date && (
                <HStack spacing={3}>
                  <Button colorScheme="green" flex={1} onClick={handleAccept} isLoading={isSubmitting}>
                    Accept
                  </Button>
                  <Button colorScheme="red" flex={1} onClick={handleReject} isLoading={isSubmitting}>
                    Reject
                  </Button>
                </HStack>
              )}

              {exchange.status === 'ACCEPTED' && (
                <Button 
                  colorScheme="yellow" 
                  onClick={handleConfirmCompletion}
                  isLoading={isSubmitting}
                  isDisabled={isRequester ? exchange.requester_confirmed : exchange.provider_confirmed}
                >
                  {isRequester ? exchange.requester_confirmed : exchange.provider_confirmed 
                    ? 'Waiting for confirmation...' 
                    : 'Mark as Completed'}
                </Button>
              )}

              {exchange.status === 'COMPLETED' && !hasRated() && (
                <Button colorScheme="yellow" onClick={onRatingOpen}>
                  Rate Exchange
                </Button>
              )}
            </Stack>
          </GridItem>

          <GridItem>
            <Stack spacing={6}>
              {/* Chat */}
              <Box bg="#E2E8F0" p={6} borderRadius="xl" boxShadow="sm">
                <Flex align="center" justify="space-between" mb={6}>
                  <Box>
                    <Text fontSize="lg" fontWeight="700">Handshake Chat</Text>
                    <Text color="gray.600" fontSize="sm">Coordinate the final details.</Text>
                  </Box>
                </Flex>

                <VStack flex={1} spacing={4} align="stretch" maxH="540px" overflowY="auto" mb={4}>
                  {chatMessages.map((msg) => (
                    <Flex key={msg.id} justify={msg.sender === (isRequester ? 'requester' : 'provider') ? 'flex-end' : 'flex-start'}>
                      <HStack spacing={2} align="flex-start">
                        {msg.sender === 'provider' && <Avatar size="sm" name={provider.first_name} />}
                        <Box
                          bg={msg.sender === (isRequester ? 'requester' : 'provider') ? '#F6AD55' : '#4A5568'}
                          color="white"
                          px={4}
                          py={3}
                          borderRadius="xl"
                          maxW="440px"
                        >
                          <Text fontSize="sm">{msg.text}</Text>
                        </Box>
                        {msg.sender === (isRequester ? 'requester' : 'provider') && <Avatar size="sm" name={isRequester ? requester.first_name : provider.first_name} />}
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
            </Stack>
          </GridItem>
        </Grid>
      </Container>

      {/* Propose Date/Time Modal */}
      <Modal isOpen={isProposeOpen} onClose={onProposeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Propose Date & Time</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Time (Optional)</FormLabel>
                <Input
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onProposeClose}>
              Cancel
            </Button>
            <Button colorScheme="yellow" onClick={handleProposeDateTime} isLoading={isSubmitting}>
              Propose
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rating Modal */}
      <Modal isOpen={isRatingOpen} onClose={onRatingClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rate Your Experience</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={6}>
              <Text fontSize="sm" color="gray.600">
                Rate {otherUser?.first_name} {otherUser?.last_name}
              </Text>

              <FormControl>
                <FormLabel>Communication (1-5)</FormLabel>
                <RadioGroup
                  value={rating.communication.toString()}
                  onChange={(val) => setRating({ ...rating, communication: parseInt(val) })}
                >
                  <HStack spacing={4}>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <Radio key={val} value={val.toString()}>
                        {val}
                      </Radio>
                    ))}
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Punctuality (1-5)</FormLabel>
                <RadioGroup
                  value={rating.punctuality.toString()}
                  onChange={(val) => setRating({ ...rating, punctuality: parseInt(val) })}
                >
                  <HStack spacing={4}>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <Radio key={val} value={val.toString()}>
                        {val}
                      </Radio>
                    ))}
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Would Recommend?</FormLabel>
                <RadioGroup
                  value={rating.would_recommend ? 'yes' : 'no'}
                  onChange={(val) => setRating({ ...rating, would_recommend: val === 'yes' })}
                >
                  <HStack spacing={4}>
                    <Radio value="yes">Yes</Radio>
                    <Radio value="no">No</Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Comment (Optional)</FormLabel>
                <Textarea
                  value={rating.comment}
                  onChange={(e) => setRating({ ...rating, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows={3}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRatingClose}>
              Cancel
            </Button>
            <Button colorScheme="yellow" onClick={handleSubmitRating} isLoading={isSubmitting}>
              Submit Rating
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default HandshakePage
