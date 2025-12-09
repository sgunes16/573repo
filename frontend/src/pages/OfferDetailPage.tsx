import {
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
  VStack,
  useDisclosure,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import UserAvatar from '@/components/UserAvatar'
import ReportModal from '@/components/ReportModal'
import { offerService } from '@/services/offer.service'
import { exchangeService } from '@/services/exchange.service'
import { mapboxService } from '@/services/mapbox.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { Offer, OfferImage, Exchange } from '@/types'
import {
  MdAccessTime,
  MdArrowBack,
  MdCalendarToday,
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
  const { user } = useAuthStore()
  const [offer, setOffer] = useState<Offer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locationAddress, setLocationAddress] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [myExchange, setMyExchange] = useState<Exchange | null>(null)
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure()

  const isOwner = user?.id === offer?.user_id || user?.id === offer?.user?.id

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
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
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
                    <Text fontWeight="500">{formatDate(offer.date)}</Text>
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
                    <Text fontWeight="500">{offer.activity_type === 'group' ? 'Group' : '1-to-1'}</Text>
                  </Box>
                </HStack>
                <HStack>
                  <Icon as={MdLocationOn} color="gray.400" boxSize={4} />
                  <Box>
                    <Text color="gray.500" fontSize="xs">Location</Text>
                    <Text fontWeight="500" noOfLines={1}>
                      {offer.location_type === 'remote' ? 'Remote' : locationAddress || 'TBD'}
                    </Text>
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
                  <Button
                    w="100%"
                    size="sm"
                    colorScheme="purple"
                    variant="outline"
                    leftIcon={<Icon as={MdEdit} boxSize={4} />}
                    onClick={() => navigate(`/create-offer?edit=${offer.id}`)}
                    mb={3}
                  >
                    Edit
                  </Button>
                  
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
                    {myExchange.proposed_date && (
                      <Text fontSize="xs" color="gray.600">
                        {new Date(myExchange.proposed_date).toLocaleDateString()}
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
                <Button
                  w="100%"
                  size="sm"
                  bg="yellow.400"
                  color="black"
                  leftIcon={<Icon as={MdHandshake} boxSize={4} />}
                  _hover={{ bg: 'yellow.500' }}
                  onClick={() => navigate(`/handshake/offer/${offer.id}`)}
                >
                  {offer.type === 'offer' ? 'Request' : 'Offer Help'}
                </Button>
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
    </Box>
  )
}

export default OfferDetailPage
