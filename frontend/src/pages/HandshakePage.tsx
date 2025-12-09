import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
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
  Spinner,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Chat from '@/components/Chat'
import UserAvatar from '@/components/UserAvatar'
import ReportModal from '@/components/ReportModal'
import { exchangeService } from '@/services/exchange.service'
import { mapboxService } from '@/services/mapbox.service'
import { getUserBadge } from '@/services/mock/mockData'
import { useAuthStore } from '@/store/useAuthStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getAccessToken } from '@/utils/cookies'
import type { Exchange, User } from '@/types'
import { 
  MdAccessTime, 
  MdCalendarToday, 
  MdLocationPin, 
  MdPeople,
  MdReport,
} from 'react-icons/md'

const HandshakePage = () => {
  const { exchangeId, offerId } = useParams<{ exchangeId?: string; offerId?: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const currentUser = user as unknown as User

  const [exchange, setExchange] = useState<Exchange | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const isCreatingRef = useRef(false)
  const [locationAddress, setLocationAddress] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isOpen: isProposeOpen, onOpen: onProposeOpen, onClose: onProposeClose } = useDisclosure()
  const { isOpen: isRatingOpen, onOpen: onRatingOpen, onClose: onRatingClose } = useDisclosure()
  const { isOpen: isReportExchangeOpen, onOpen: onReportExchangeOpen, onClose: onReportExchangeClose } = useDisclosure()

  const [proposedDate, setProposedDate] = useState('')
  const [proposedTime, setProposedTime] = useState('')
  const [rating, setRating] = useState({
    communication: 5,
    punctuality: 5,
    would_recommend: true,
    comment: '',
  })

  useWebSocket({
    url: exchange ? `/ws/exchange/${exchange.id}/` : '',
    token: getAccessToken() || undefined,
    onMessage: (message) => {
      if (message.type === 'exchange_update' && message.data) {
        const prevStatus = exchange?.status
        const newStatus = message.data.status
        
        setExchange((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            status: message.data.status,
            proposed_date: message.data.proposed_date,
            proposed_time: message.data.proposed_time,
            requester_confirmed: message.data.requester_confirmed,
            provider_confirmed: message.data.provider_confirmed,
            completed_at: message.data.completed_at,
          }
        })
        
        // Sadece önemli değişikliklerde toast göster (status değiştiyse)
        if (prevStatus !== newStatus) {
          if (newStatus === 'COMPLETED') {
            toast({ title: 'Exchange completed!', status: 'success', duration: 2000 })
            onRatingOpen()
          } else if (newStatus === 'ACCEPTED' && prevStatus === 'PENDING') {
            toast({ title: 'Exchange accepted!', status: 'success', duration: 2000 })
          }
        }
      } else if (message.type === 'exchange_state' && message.data) {
        setExchange((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            status: message.data.status,
            proposed_date: message.data.proposed_date,
            proposed_time: message.data.proposed_time,
            requester_confirmed: message.data.requester_confirmed,
            provider_confirmed: message.data.provider_confirmed,
            completed_at: message.data.completed_at,
          }
        })
      }
    },
    reconnect: !!exchange,
  })

  // Automatically create exchange when offerId is provided and no exchange exists
  useEffect(() => {
    const fetchOrCreateExchange = async () => {
      // Prevent duplicate requests (React StrictMode or re-renders)
      if (isCreatingRef.current) return
      
      setIsLoading(true)
      try {
        let exchangeData: Exchange | null = null

        if (exchangeId) {
          exchangeData = await exchangeService.getExchange(exchangeId)
        } else if (offerId) {
          // First try to get existing exchange
          try {
            exchangeData = await exchangeService.getExchangeByOfferId(offerId)
          } catch {
            // No existing exchange, create one automatically
            if (isCreatingRef.current) return // Double check
            isCreatingRef.current = true
            setIsCreating(true)
            try {
              const response = await exchangeService.createExchange({ offer_id: offerId })
              toast({ title: 'Handshake started!', status: 'success', duration: 2000 })
              // Fetch the created exchange
              exchangeData = await exchangeService.getExchange(response.exchange_id.toString())
            } catch (createError: any) {
              // If exchange already exists, try to fetch it
              if (createError.response?.status === 400 && createError.response?.data?.error?.includes('already')) {
                try {
                  exchangeData = await exchangeService.getExchangeByOfferId(offerId)
                } catch {
                  // Really failed
                  toast({ 
                    title: 'Error', 
                    description: createError.response?.data?.error || 'Failed to start handshake', 
                    status: 'error', 
                    duration: 3000 
                  })
                  navigate('/dashboard')
                  return
                }
              } else {
                toast({ 
                  title: 'Error', 
                  description: createError.response?.data?.error || 'Failed to start handshake', 
                  status: 'error', 
                  duration: 3000 
                })
                navigate('/dashboard')
                return
              }
            } finally {
              setIsCreating(false)
            }
          }
        }

        if (exchangeData) {
          setExchange(exchangeData)
          
          if (exchangeData.offer.geo_location && exchangeData.offer.geo_location.length === 2) {
            try {
              const address = await mapboxService.reverseGeocode(
                exchangeData.offer.geo_location[1],
                exchangeData.offer.geo_location[0]
              )
              setLocationAddress(address)
            } catch (error) {
              console.error('Failed to geocode:', error)
            }
          } else if (exchangeData.offer.location) {
            setLocationAddress(exchangeData.offer.location)
          }
        }
      } catch (error) {
        console.error('Failed to fetch exchange:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrCreateExchange()
  }, [exchangeId, offerId, navigate, toast])

  const isRequester = exchange?.requester.id === currentUser?.id
  const isProvider = exchange?.provider.id === currentUser?.id
  const otherUser = isRequester ? exchange?.provider : exchange?.requester

  const getProgressSteps = () => {
    if (!exchange) return []
    
    // Check if waiting for confirmation
    const myConfirmed = isRequester ? exchange.requester_confirmed : exchange.provider_confirmed
    const otherConfirmed = isRequester ? exchange.provider_confirmed : exchange.requester_confirmed
    const isWaitingForOther = myConfirmed && !otherConfirmed && exchange.status === 'ACCEPTED'
    
    return [
      { done: true, waiting: false }, // Request Sent
      { done: !!exchange.proposed_date, waiting: false }, // Date Proposed
      { done: exchange.status === 'ACCEPTED' || exchange.status === 'COMPLETED', waiting: false }, // Accepted
      { done: exchange.status === 'COMPLETED', waiting: isWaitingForOther }, // Completed - waiting for other's confirmation
    ]
  }

  const handleProposeDateTime = async () => {
    if (!exchange || !proposedDate) return
    setIsSubmitting(true)
    try {
      await exchangeService.proposeDateTime(exchange.id.toString(), { date: proposedDate, time: proposedTime || undefined })
      const updatedExchange = await exchangeService.getExchange(exchange.id.toString())
      setExchange(updatedExchange)
      onProposeClose()
      toast({ title: 'Date proposed!', status: 'success', duration: 2000 })
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error, status: 'error', duration: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAccept = async () => {
    if (!exchange) return
    // Zaten accepted ise işlem yapma
    if (exchange.status === 'ACCEPTED') {
      toast({ title: 'Already accepted', status: 'info', duration: 2000 })
      return
    }
    setIsSubmitting(true)
    try {
      await exchangeService.acceptExchange(exchange.id.toString())
      const updatedExchange = await exchangeService.getExchange(exchange.id.toString())
      setExchange(updatedExchange)
      toast({ title: 'Accepted!', status: 'success', duration: 2000 })
    } catch (error: any) {
      // Zaten accepted hatası ise sadece exchange'i yenile
      if (error.response?.data?.error?.includes('already') || error.response?.data?.error?.includes('Already')) {
        const updatedExchange = await exchangeService.getExchange(exchange.id.toString())
        setExchange(updatedExchange)
      } else {
        toast({ title: 'Error', description: error.response?.data?.error, status: 'error', duration: 3000 })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!exchange) return
    setIsSubmitting(true)
    try {
      await exchangeService.rejectExchange(exchange.id.toString())
      toast({ title: 'Rejected', status: 'info', duration: 2000 })
      navigate('/dashboard')
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error, status: 'error', duration: 3000 })
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
        toast({ title: 'Completed!', status: 'success', duration: 2000 })
        onRatingOpen()
      } else {
        toast({ title: 'Waiting for other party', status: 'info', duration: 2000 })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error, status: 'error', duration: 3000 })
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
      toast({ title: 'Rating submitted!', status: 'success', duration: 2000 })
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error, status: 'error', duration: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const hasRated = () => {
    if (!exchange || !exchange.ratings) return false
    return exchange.ratings.some(r => r.rater_id === currentUser?.id)
  }

  if (isLoading || isCreating) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Flex direction="column" align="center" justify="center" h="calc(100vh - 56px)" gap={4}>
          <Spinner size="lg" color="yellow.400" />
          <Text fontSize="sm" color="gray.500">
            {isCreating ? 'Starting handshake...' : 'Loading...'}
          </Text>
        </Flex>
      </Box>
    )
  }

  if (!exchange) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Box maxW="500px" mx="auto" px={4} py={20} textAlign="center">
          <Text fontWeight="600" mb={4}>Something went wrong</Text>
          <Button colorScheme="yellow" size="sm" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    )
  }

  const offer = exchange.offer
  const provider = exchange.provider
  const requester = exchange.requester
  const providerBadge = getUserBadge((provider.profile as any)?.time_credits || 0)
  const steps = getProgressSteps()
  const stepLabels = ['Requested', 'Date Set', 'Accepted', 'Done']

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      
      {/* Progress Dots - Fixed at top */}
      <Box 
        bg="white" 
        borderBottom="1px solid" 
        borderColor="gray.100" 
        py={3}
        position="sticky"
        top="56px"
        zIndex={10}
      >
        <HStack justify="center" spacing={0} maxW="400px" mx="auto" px={4}>
          {steps.map((step, idx) => (
            <Flex key={idx} align="center" flex={idx < steps.length - 1 ? 1 : 'none'}>
              <VStack spacing={1}>
                <Box
                  w="24px"
                  h="24px"
                  borderRadius="full"
                  bg={step.done ? 'yellow.400' : step.waiting ? 'orange.300' : 'gray.200'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.2s"
                >
                  {step.done && (
                    <Text fontSize="xs" fontWeight="bold" color="black">✓</Text>
                  )}
                  {step.waiting && !step.done && (
                    <Icon as={MdAccessTime} color="white" boxSize={3} />
                  )}
                </Box>
                <Text fontSize="9px" color={step.done ? 'gray.700' : step.waiting ? 'orange.500' : 'gray.400'} fontWeight={step.done || step.waiting ? '500' : '400'}>
                  {stepLabels[idx]}
                </Text>
              </VStack>
              {idx < steps.length - 1 && (
                <Box 
                  flex={1} 
                  h="2px" 
                  bg={steps[idx + 1].done ? 'yellow.400' : steps[idx + 1].waiting ? 'orange.200' : 'gray.200'} 
                  mx={1}
                  mb={4}
                  transition="all 0.2s"
                />
              )}
            </Flex>
          ))}
        </HStack>
      </Box>

      <Box maxW="1100px" mx="auto" px={4} py={4}>
        <Grid templateColumns={{ base: '1fr', lg: '340px 1fr' }} gap={4} alignItems="flex-start">
          {/* Left Panel */}
          <VStack spacing={3} align="stretch">
            {/* Offer Info */}
            <Box p={3} borderRadius="lg" border="1px solid" borderColor="gray.100" bg="gray.50">
              <Flex justify="space-between" align="flex-start" mb={2}>
                <Box flex={1}>
                  <Text fontWeight="600" fontSize="sm" mb={1}>{offer.title}</Text>
                  <Badge colorScheme={offer.type === 'offer' ? 'green' : 'blue'} fontSize="10px">
                    {offer.type === 'offer' ? 'Offer' : 'Want'}
                  </Badge>
                </Box>
                <HStack spacing={1}>
                  <Badge bg="yellow.100" color="yellow.700" fontSize="10px">
                    ⭐ {((provider.profile as any)?.rating || 0).toFixed(1)}
                  </Badge>
                  <Badge colorScheme={providerBadge.color as any} fontSize="10px" textTransform="uppercase">
                    {providerBadge.label}
                  </Badge>
                </HStack>
              </Flex>

              {offer.description && (
                <Text fontSize="xs" color="gray.600" mb={2} noOfLines={2}>
                  {offer.description}
                </Text>
              )}

              <VStack align="stretch" spacing={1} fontSize="xs">
                {/* Orijinal Offer Tarihi */}
                {offer.date && (
                  <Flex justify="space-between">
                    <HStack><Icon as={MdCalendarToday} boxSize={3} /><Text>Offer Date</Text></HStack>
                    <Text fontWeight="500" color="gray.600">{formatDate(offer.date)} {offer.time || ''}</Text>
                  </Flex>
                )}
                {/* Proposed Date */}
                <Flex justify="space-between">
                  <HStack><Icon as={MdCalendarToday} boxSize={3} color={exchange.proposed_date ? 'green.500' : 'gray.400'} /><Text>Proposed Date</Text></HStack>
                  {exchange.proposed_date ? (
                    <Text fontWeight="600" color="green.600">{formatDate(exchange.proposed_date)} {exchange.proposed_time || ''}</Text>
                  ) : (
                    <Text fontWeight="500" color="orange.500">Not set yet</Text>
                  )}
                </Flex>
                <Flex justify="space-between">
                  <HStack><Icon as={MdLocationPin} boxSize={3} /><Text>Location</Text></HStack>
                  <Text fontWeight="500" noOfLines={1} maxW="140px">
                    {offer.location_type === 'remote' ? 'Remote' : locationAddress || 'TBD'}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <HStack><Icon as={MdAccessTime} boxSize={3} /><Text>Duration</Text></HStack>
                  <Text fontWeight="500">{offer.time_required}H</Text>
                </Flex>
                <Flex justify="space-between">
                  <HStack><Icon as={MdPeople} boxSize={3} /><Text>Type</Text></HStack>
                  <Text fontWeight="500">{offer.activity_type === 'group' ? 'Group' : '1-to-1'}</Text>
                </Flex>
              </VStack>
            </Box>

            {/* Participants */}
            <Box p={3} borderRadius="lg" border="1px solid" borderColor="gray.100">
              <Text fontWeight="500" fontSize="xs" color="gray.500" mb={2}>Participants</Text>
              <VStack spacing={2} align="stretch">
                <Flex align="center" justify="space-between">
                  <HStack spacing={2}>
                    <UserAvatar size="xs" user={provider} />
                    <Text fontSize="xs" fontWeight="500">{provider.first_name} {provider.last_name}</Text>
                  </HStack>
                  <Badge colorScheme="green" fontSize="9px">Provider</Badge>
                </Flex>
                <Flex align="center" justify="space-between">
                  <HStack spacing={2}>
                    <UserAvatar size="xs" user={requester} />
                    <Text fontSize="xs" fontWeight="500">{requester.first_name} {requester.last_name}</Text>
                  </HStack>
                  <Badge colorScheme="blue" fontSize="9px">Requester</Badge>
                </Flex>
              </VStack>
              {exchange && (
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  leftIcon={<Icon as={MdReport} boxSize={3} />}
                  onClick={onReportExchangeOpen}
                  mt={3}
                  w="100%"
                >
                  Report Exchange
                </Button>
              )}
            </Box>

            {/* Actions */}
            {exchange.status === 'PENDING' && isRequester && !exchange.proposed_date && (
              <Button colorScheme="yellow" size="sm" onClick={onProposeOpen}>Propose Date</Button>
            )}
            
            {exchange.status === 'PENDING' && isProvider && exchange.proposed_date && (
              <HStack spacing={2}>
                <Button colorScheme="green" size="sm" flex={1} onClick={handleAccept} isLoading={isSubmitting}>Accept</Button>
                <Button colorScheme="red" variant="outline" size="sm" flex={1} onClick={handleReject} isLoading={isSubmitting}>Reject</Button>
              </HStack>
            )}

            {exchange.status === 'ACCEPTED' && (
              <>
                {/* Eğer ben onayladıysam ama karşı taraf henüz onaylamadıysa */}
                {(isRequester ? exchange.requester_confirmed : exchange.provider_confirmed) && 
                 !(isRequester ? exchange.provider_confirmed : exchange.requester_confirmed) && (
                  <Box 
                    p={3} 
                    bg="orange.50" 
                    borderRadius="md" 
                    border="1px solid" 
                    borderColor="orange.200"
                  >
                    <HStack spacing={2}>
                      <Icon as={MdAccessTime} color="orange.500" boxSize={4} />
                      <Text fontSize="xs" color="orange.700">
                        Waiting for {otherUser?.first_name}'s confirmation
                      </Text>
                    </HStack>
                  </Box>
                )}
                {/* Eğer ben henüz onaylamadıysam */}
                {!(isRequester ? exchange.requester_confirmed : exchange.provider_confirmed) && (
                  <Button 
                    colorScheme="yellow" 
                    size="sm"
                    onClick={handleConfirmCompletion}
                    isLoading={isSubmitting}
                  >
                    Mark Complete
                  </Button>
                )}
              </>
            )}

            {exchange.status === 'COMPLETED' && !hasRated() && (
              <Button colorScheme="yellow" size="sm" onClick={onRatingOpen}>Rate</Button>
            )}
          </VStack>

          {/* Chat */}
          <Box borderRadius="lg" border="1px solid" borderColor="gray.100" h={{ base: '350px', lg: '550px' }} overflow="hidden">
            {exchange && <Chat exchangeId={exchange.id} />}
          </Box>
        </Grid>
      </Box>

      {/* Propose Modal */}
      <Modal isOpen={isProposeOpen} onClose={onProposeClose} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md">Propose Date</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={3}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Date</FormLabel>
                <Input type="date" size="sm" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Time</FormLabel>
                <Input type="time" size="sm" value={proposedTime} onChange={(e) => setProposedTime(e.target.value)} />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="sm" mr={2} onClick={onProposeClose}>Cancel</Button>
            <Button colorScheme="yellow" size="sm" onClick={handleProposeDateTime} isLoading={isSubmitting}>Propose</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rating Modal */}
      <Modal isOpen={isRatingOpen} onClose={onRatingClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md">Rate {otherUser?.first_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Communication</FormLabel>
                <RadioGroup value={rating.communication.toString()} onChange={(val) => setRating({ ...rating, communication: parseInt(val) })}>
                  <HStack spacing={3}>{[1, 2, 3, 4, 5].map((val) => <Radio key={val} value={val.toString()} size="sm">{val}</Radio>)}</HStack>
                </RadioGroup>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Punctuality</FormLabel>
                <RadioGroup value={rating.punctuality.toString()} onChange={(val) => setRating({ ...rating, punctuality: parseInt(val) })}>
                  <HStack spacing={3}>{[1, 2, 3, 4, 5].map((val) => <Radio key={val} value={val.toString()} size="sm">{val}</Radio>)}</HStack>
                </RadioGroup>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Would Recommend?</FormLabel>
                <RadioGroup value={rating.would_recommend ? 'yes' : 'no'} onChange={(val) => setRating({ ...rating, would_recommend: val === 'yes' })}>
                  <HStack spacing={3}><Radio value="yes" size="sm">Yes</Radio><Radio value="no" size="sm">No</Radio></HStack>
                </RadioGroup>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Comment</FormLabel>
                <Textarea size="sm" value={rating.comment} onChange={(e) => setRating({ ...rating, comment: e.target.value })} rows={2} />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="sm" mr={2} onClick={onRatingClose}>Cancel</Button>
            <Button colorScheme="yellow" size="sm" onClick={handleSubmitRating} isLoading={isSubmitting}>Submit</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Report Exchange Modal */}
      {exchange && (
        <ReportModal
          isOpen={isReportExchangeOpen}
          onClose={onReportExchangeClose}
          targetType="exchange"
          targetId={parseInt(exchange.id)}
        />
      )}
    </Box>
  )
}

export default HandshakePage
