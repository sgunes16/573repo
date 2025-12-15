import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  Tag,
  Text,
  useToast,
  VStack,
  useDisclosure,
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import UserAvatar from '@/components/UserAvatar'
import ReportModal from '@/components/ReportModal'
import LocationDisplay from '@/components/LocationDisplay'
import { offerService } from '@/services/offer.service'
import { exchangeService } from '@/services/exchange.service'
import { mapboxService } from '@/services/mapbox.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { Offer, OfferImage, Exchange } from '@/types'
import {
  MdAccessTime,
  MdArrowBack,
  MdCalendarToday,
  MdDelete,
  MdEdit,
  MdGroup,
  MdHandshake,
  MdLocationOn,
  MdMoreVert,
  MdPerson,
  MdReport,
  MdStar,
} from 'react-icons/md'

const OfferDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const [offer, setOffer] = useState<Offer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [locationAddress, setLocationAddress] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [myExchange, setMyExchange] = useState<Exchange | null>(null)
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const isOwner = user?.id === offer?.user_id || user?.id === offer?.user?.id

  const handleDelete = async () => {
    if (!offer?.id) return
    
    setIsDeleting(true)
    try {
      const result = await offerService.deleteOffer(offer.id)
      toast({
        title: 'Deleted successfully',
        description: result.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onDeleteClose()
      navigate('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message || 'An error occurred while deleting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return
      
      setIsLoading(true)
      try {
        const data = await offerService.getOfferById(id)
        setOffer(data)
        
        const primaryImage = data.images?.find((img: OfferImage) => img.is_primary)
        if (primaryImage) {
          setSelectedImage(primaryImage.url)
        } else if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0].url)
        }
        
        if (data.geo_location && data.geo_location.length === 2) {
          const address = await mapboxService.reverseGeocode(
            data.geo_location[1],
            data.geo_location[0]
          )
          setLocationAddress(address)
        } else if (data.location) {
          setLocationAddress(data.location)
        }

        if (user?.id === data.user_id || user?.id === data.user?.id) {
          try {
            const exchangesData = await exchangeService.getExchangesForOffer(id)
            setExchanges(exchangesData)
          } catch (error) {
            console.error('Failed to fetch exchanges:', error)
          }
        } else {
          try {
            const existingExchange = await exchangeService.getExchangeByOfferId(id)
            if (existingExchange) {
              setMyExchange(existingExchange)
            }
          } catch (error) {
            console.log('No existing exchange for this offer')
          }
        }
      } catch (error) {
        console.error('Failed to fetch offer:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOffer()
  }, [id, user?.id])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not specified'
    const date = new Date(dateStr)
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    const timeFormatted = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
    // Only show time if it's not midnight (00:00)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    if (hours === 0 && minutes === 0) return dateFormatted
    return `${dateFormatted}, ${timeFormatted}`
  }

  if (isLoading) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Box maxW="900px" mx="auto" px={4} py={6}>
          <Skeleton height="32px" width="100px" mb={4} />
          <Grid templateColumns={{ base: '1fr', lg: '1fr 300px' }} gap={6}>
            <Box>
              <Skeleton height="300px" borderRadius="lg" mb={4} />
              <Skeleton height="150px" borderRadius="lg" />
            </Box>
            <Box>
              <Skeleton height="200px" borderRadius="lg" />
            </Box>
          </Grid>
        </Box>
      </Box>
    )
  }

  if (!offer) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Box maxW="900px" mx="auto" px={4} py={20} textAlign="center">
          <Heading size="md" color="gray.600" mb={4}>Offer not found</Heading>
          <Button size="sm" leftIcon={<Icon as={MdArrowBack} />} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      <Box maxW="900px" mx="auto" px={4} py={6}>
        {/* Back Button */}
        <Button
          leftIcon={<Icon as={MdArrowBack} boxSize={4} />}
          variant="ghost"
          size="sm"
          mb={4}
          onClick={() => navigate('/dashboard')}
        >
          Back
        </Button>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 280px' }} gap={6}>
          {/* Main Content */}
          <Box>
            {/* Type & Title */}
            <Flex justify="space-between" align="flex-start" mb={3}>
              <HStack spacing={2}>
                <Badge
                  colorScheme={offer.type === 'offer' ? 'green' : 'blue'}
                  fontSize="xs"
                  px={2}
                  borderRadius="full"
                >
                  {offer.type === 'offer' ? '🤝 Offer' : '🙋 Want'}
                </Badge>
                {isOwner && (
                  <Badge colorScheme="purple" fontSize="xs" px={2} borderRadius="full">
                    Yours
                  </Badge>
                )}
              </HStack>
              {!isOwner && (
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    minW="auto"
                    px={2}
                  >
                    <Icon as={MdMoreVert} boxSize={5} />
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<Icon as={MdReport} />} onClick={onReportOpen}>
                      Report
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </Flex>

            <Heading size="lg" mb={4}>{offer.title}</Heading>

            {/* Images */}
            {offer.images && offer.images.length > 0 ? (
              <Box mb={4}>
                <Image
                  src={selectedImage || offer.images[0].url}
                  alt={offer.title}
                  borderRadius="lg"
                  w="100%"
                  h="280px"
                  objectFit="cover"
                  mb={2}
                  fallback={<Skeleton height="280px" borderRadius="lg" />}
                />
                {offer.images.length > 1 && (
                  <HStack spacing={2} overflowX="auto">
                    {offer.images.map((img: OfferImage) => (
                      <Image
                        key={img.id}
                        src={img.url}
                        w="60px"
                        h="45px"
                        objectFit="cover"
                        borderRadius="md"
                        cursor="pointer"
                        border={selectedImage === img.url ? '2px solid' : '1px solid'}
                        borderColor={selectedImage === img.url ? 'yellow.400' : 'gray.200'}
                        onClick={() => setSelectedImage(img.url)}
                      />
                    ))}
                  </HStack>
                )}
              </Box>
            ) : (
              <Box mb={4} h="150px" bg="gray.100" borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
                <Text color="gray.400" fontSize="sm">No images</Text>
              </Box>
            )}

            {/* Description */}
            <Box mb={4}>
              <Text fontWeight="600" fontSize="sm" mb={2}>Description</Text>
              <Text color="gray.600" fontSize="sm" whiteSpace="pre-wrap">
                {offer.description || 'No description provided.'}
              </Text>
            </Box>

            {/* Tags */}
            {offer.tags && offer.tags.length > 0 && (
              <Box mb={4}>
                <Text fontWeight="600" fontSize="sm" mb={2}>Tags</Text>
                <HStack spacing={2} flexWrap="wrap">
                  {offer.tags.map((tag) => (
                    <Tag key={tag} size="sm" borderRadius="full" bg="gray.100">#{tag}</Tag>
                  ))}
                </HStack>
              </Box>
            )}

            {/* Details */}
            <Box p={4} bg="gray.50" borderRadius="lg">
              <Text fontWeight="600" fontSize="sm" mb={3}>Details</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={3} fontSize="sm">
                <HStack>
                  <Icon as={MdCalendarToday} color="gray.400" boxSize={4} />
                  <Box>
                    <Text color="gray.500" fontSize="xs">Date</Text>
                    <Text fontWeight="500">{formatDate(offer.scheduled_at)}</Text>
                  </Box>
                </HStack>
                <HStack>
                  <Icon as={MdAccessTime} color="gray.400" boxSize={4} />
                  <Box>
                    <Text color="gray.500" fontSize="xs">Duration</Text>
                    <Text fontWeight="500">{offer.time_required}H</Text>
                  </Box>
                </HStack>
                <HStack>
                  <Icon as={offer.activity_type === 'group' ? MdGroup : MdPerson} color="gray.400" boxSize={4} />
                  <Box>
                    <Text color="gray.500" fontSize="xs">Type</Text>
                    <Text fontWeight="500">
                      {offer.activity_type === 'group' ? 'Group' : '1-to-1'}
                      {offer.activity_type === 'group' && (
                        <Badge ml={2} colorScheme={offer.slots_available ? 'green' : 'orange'} fontSize="10px">
                          {offer.active_slots || 0}/{offer.total_slots || offer.person_count} active
                          {(offer.completed_slots || 0) > 0 && ` (${offer.completed_slots} done)`}
                        </Badge>
                      )}
                    </Text>
                  </Box>
                </HStack>
                <HStack>
                  <Icon as={MdLocationOn} color="gray.400" boxSize={4} />
                  <Box>
                    <Text color="gray.500" fontSize="xs">Location</Text>
                    <LocationDisplay 
                      address={offer.location_type === 'remote' ? 'Remote' : locationAddress || 'TBD'}
                      size="medium"
                      fontWeight="500"
                    />
                  </Box>
                </HStack>
              </Grid>
            </Box>
          </Box>

          {/* Sidebar */}
          <VStack spacing={4} align="stretch">
            {/* Owner Card */}
            <Box p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
              <Text fontSize="xs" color="gray.500" mb={3}>
                {offer.type === 'offer' ? 'Offered by' : 'Requested by'}
              </Text>
              <Flex align="center" gap={3} mb={3}>
                <UserAvatar
                  size="md"
                  user={offer.user}
                  cursor="pointer"
                  onClick={() => offer.user?.id && navigate(`/profile/${offer.user.id}`)}
                />
                <Box flex={1}>
                  <Text 
                    fontWeight="600"
                    fontSize="sm"
                    cursor="pointer"
                    onClick={() => offer.user?.id && navigate(`/profile/${offer.user.id}`)}
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {offer.user?.first_name} {offer.user?.last_name}
                  </Text>
                  <HStack spacing={1}>
                    <Icon as={MdStar} color="yellow.400" boxSize={3} />
                    <Text fontSize="xs" color="gray.500">
                      {offer.user?.profile?.rating?.toFixed(1) || '0.0'}
                    </Text>
                  </HStack>
                </Box>
              </Flex>
              
              <Divider my={3} />

              {isOwner ? (
                <>
                  <HStack spacing={2} mb={3}>
                    <Button
                      flex={1}
                      size="sm"
                      colorScheme="purple"
                      variant="outline"
                      leftIcon={<Icon as={MdEdit} boxSize={4} />}
                      onClick={() => navigate(`/create-offer?edit=${offer.id}`)}
                      isDisabled={offer.can_edit === false}
                      title={offer.can_edit === false ? 'Cannot edit - only offers with no exchanges or cancelled exchanges can be edited' : undefined}
                    >
                      {offer.can_edit === false ? 'Locked' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      leftIcon={<Icon as={MdDelete} boxSize={4} />}
                      onClick={onDeleteOpen}
                      isDisabled={exchanges.some(ex => ['PENDING', 'ACCEPTED', 'COMPLETED'].includes(ex.status))}
                      title={exchanges.some(ex => ['PENDING', 'ACCEPTED', 'COMPLETED'].includes(ex.status)) 
                        ? 'Cannot delete - only offers with no exchanges or cancelled exchanges can be deleted' 
                        : 'Delete this offer'}
                    >
                      Delete
                    </Button>
                  </HStack>
                  
                  {exchanges.length > 0 && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={2} fontWeight="500">
                        Requests ({exchanges.length})
                      </Text>
                      <VStack spacing={2} align="stretch" maxH="250px" overflowY="auto">
                        {exchanges.map((exchange) => (
                          <Box
                            key={exchange.id}
                            p={2}
                            bg="gray.50"
                            borderRadius="md"
                            cursor="pointer"
                            _hover={{ bg: 'gray.100' }}
                            onClick={() => navigate(`/handshake/exchange/${exchange.id}`)}
                          >
                            <Flex justify="space-between" align="center">
                              <HStack spacing={2}>
                                <UserAvatar size="xs" user={exchange.requester} />
                                <Text fontSize="xs" fontWeight="500">
                                  {exchange.requester.first_name}
                                </Text>
                              </HStack>
                              <Badge
                                size="sm"
                                colorScheme={
                                  exchange.status === 'ACCEPTED' ? 'green' :
                                  exchange.status === 'PENDING' ? 'yellow' :
                                  exchange.status === 'COMPLETED' ? 'blue' : 'gray'
                                }
                                fontSize="10px"
                              >
                                {exchange.status}
                              </Badge>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </>
              ) : myExchange ? (
                <Box>
                  <Box
                    p={3}
                    bg={
                      myExchange.status === 'COMPLETED' ? 'green.50' :
                      myExchange.status === 'ACCEPTED' ? 'blue.50' :
                      'yellow.50'
                    }
                    borderRadius="md"
                    mb={2}
                  >
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontSize="xs" fontWeight="600">Your Request</Text>
                      <Badge
                        size="sm"
                        colorScheme={
                          myExchange.status === 'COMPLETED' ? 'green' :
                          myExchange.status === 'ACCEPTED' ? 'blue' : 'yellow'
                        }
                        fontSize="10px"
                      >
                        {myExchange.status}
                      </Badge>
                    </Flex>
                    {myExchange.proposed_at && (
                      <Text fontSize="xs" color="gray.600">
                        {new Date(myExchange.proposed_at).toLocaleDateString()}
                      </Text>
                    )}
                  </Box>
                  <Button
                    w="100%"
                    size="sm"
                    bg="yellow.400"
                    color="black"
                    leftIcon={<Icon as={MdHandshake} boxSize={4} />}
                    _hover={{ bg: 'yellow.500' }}
                    onClick={() => navigate(`/handshake/exchange/${myExchange.id}`)}
                  >
                    View Handshake
                  </Button>
                </Box>
              ) : (
                <Box>
                  {offer.activity_type === 'group' && !offer.slots_available && (
                    <Box mb={2} p={2} bg="orange.50" borderRadius="md">
                      <Text fontSize="xs" color="orange.600" textAlign="center">
                        All slots are currently active ({offer.active_slots}/{offer.total_slots})
                        {(offer.completed_slots || 0) > 0 && ` - ${offer.completed_slots} completed`}
                      </Text>
                    </Box>
                  )}
                  <Button
                    w="100%"
                    size="sm"
                    bg="yellow.400"
                    color="black"
                    leftIcon={<Icon as={MdHandshake} boxSize={4} />}
                    _hover={{ bg: 'yellow.500' }}
                    onClick={() => {
                      if (user?.is_banned) {
                        toast({
                          title: 'Account Suspended',
                          description: 'You cannot start exchanges while your account is suspended.',
                          status: 'error',
                          duration: 5000,
                        })
                        return
                      }
                      navigate(`/handshake/offer/${offer.id}`)
                    }}
                    isDisabled={(offer.activity_type === 'group' && !offer.slots_available) || user?.is_banned}
                    title={user?.is_banned ? 'Your account is suspended' : undefined}
                  >
                    {user?.is_banned ? 'Suspended' : offer.type === 'offer' ? 'Request' : 'Offer Help'}
                  </Button>
                </Box>
              )}
            </Box>

            {/* Quick Info */}
            <Box p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
              <Text fontWeight="600" fontSize="xs" mb={3}>Quick Info</Text>
              <VStack spacing={2} align="stretch" fontSize="xs">
                <Flex justify="space-between">
                  <Text color="gray.500">Posted</Text>
                  <Text fontWeight="500">{new Date(offer.created_at).toLocaleDateString()}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Duration</Text>
                  <Text fontWeight="500">{offer.time_required}H</Text>
                </Flex>
              </VStack>
            </Box>
          </VStack>
        </Grid>
      </Box>

      {/* Report Modal */}
      {offer && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={onReportClose}
          targetType={offer.type}
          targetId={parseInt(offer.id)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {offer?.type === 'offer' ? 'Offer' : 'Want'}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete <strong>"{offer?.title}"</strong>?
              <Text mt={2} fontSize="sm" color="gray.600">
                This action cannot be undone. All associated images and data will be permanently removed.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose} size="sm">
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete} 
                ml={3} 
                size="sm"
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

export default OfferDetailPage
