import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  Skeleton,
  Tag,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { offerService } from '@/services/offer.service'
import { mapboxService } from '@/services/mapbox.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { Offer, OfferImage } from '@/types'
import {
  MdAccessTime,
  MdArrowBack,
  MdCalendarToday,
  MdEdit,
  MdGroup,
  MdHandshake,
  MdLocationOn,
  MdPerson,
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

  // Check if current user is the owner of this offer
  const isOwner = user?.id === offer?.user_id || user?.id === offer?.user?.id

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return
      
      setIsLoading(true)
      try {
        const data = await offerService.getOfferById(id)
        setOffer(data)
        
        // Set primary image as selected
        const primaryImage = data.images?.find((img: OfferImage) => img.is_primary)
        if (primaryImage) {
          setSelectedImage(primaryImage.url)
        } else if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0].url)
        }
        
        // Fetch location address if geo_location exists
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
  }, [id])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not specified'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return ''
    return timeStr
  }

  if (isLoading) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Navbar showUserInfo={true} />
        <Container maxW="1000px" py={8}>
          <Skeleton height="40px" width="100px" mb={6} />
          <Grid templateColumns={{ base: '1fr', lg: '1fr 350px' }} gap={8}>
            <Box>
              <Skeleton height="400px" borderRadius="xl" mb={6} />
              <Skeleton height="200px" borderRadius="xl" />
            </Box>
            <Box>
              <Skeleton height="250px" borderRadius="xl" mb={4} />
              <Skeleton height="150px" borderRadius="xl" />
            </Box>
          </Grid>
        </Container>
      </Box>
    )
  }

  if (!offer) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Navbar showUserInfo={true} />
        <Container maxW="1000px" py={8}>
          <VStack spacing={4} py={20}>
            <Heading size="lg" color="gray.600">Offer not found</Heading>
            <Button leftIcon={<Icon as={MdArrowBack} />} onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </VStack>
        </Container>
      </Box>
    )
  }

  return (
    <Box bg="gray.50" minH="100vh">
      <Navbar showUserInfo={true} />
      <Container maxW="1000px" py={8}>
        {/* Back Button */}
        <Button
          leftIcon={<Icon as={MdArrowBack} />}
          variant="ghost"
          mb={6}
          onClick={() => navigate('/dashboard')}
          _hover={{ bg: 'gray.100' }}
        >
          Back to Dashboard
        </Button>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 350px' }} gap={8}>
          {/* Main Content */}
          <Box>
            {/* Type Badge & Title */}
            <HStack mb={4} spacing={3}>
              <Badge
                colorScheme={offer.type === 'offer' ? 'green' : 'blue'}
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                {offer.type === 'offer' ? '🤝 Offer' : '🙋 Want'}
              </Badge>
              <Badge colorScheme="gray" fontSize="sm" px={3} py={1} borderRadius="full">
                {offer.status}
              </Badge>
              {isOwner && (
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1} borderRadius="full">
                  Your {offer.type}
                </Badge>
              )}
            </HStack>

            <Heading size="xl" mb={4} color="gray.800">
              {offer.title}
            </Heading>

            {/* Images */}
            {offer.images && offer.images.length > 0 ? (
              <Box mb={6}>
                <Image
                  src={selectedImage || offer.images[0].url}
                  alt={offer.title}
                  borderRadius="xl"
                  w="100%"
                  h="350px"
                  objectFit="cover"
                  mb={3}
                  fallback={<Skeleton height="350px" borderRadius="xl" />}
                />
                {offer.images && offer.images.length > 1 && (
                  <HStack spacing={2} overflowX="auto" pb={2}>
                    {offer.images.map((img: OfferImage) => (
                      <Image
                        key={img.id}
                        src={img.url}
                        alt=""
                        w="80px"
                        h="60px"
                        objectFit="cover"
                        borderRadius="md"
                        cursor="pointer"
                        border={selectedImage === img.url ? '3px solid' : '2px solid transparent'}
                        borderColor={selectedImage === img.url ? 'yellow.500' : 'transparent'}
                        onClick={() => setSelectedImage(img.url)}
                        _hover={{ opacity: 0.8 }}
                      />
                    ))}
                  </HStack>
                )}
              </Box>
            ) : (
              <Box 
                mb={6} 
                h="200px" 
                bg="gray.200" 
                borderRadius="xl" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <Text color="gray.500">No images available</Text>
              </Box>
            )}

            {/* Description */}
            <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" mb={6}>
              <Heading size="md" mb={4}>Description</Heading>
              <Text color="gray.700" whiteSpace="pre-wrap" lineHeight="tall">
                {offer.description || 'No description provided.'}
              </Text>
            </Box>

            {/* Tags */}
            {offer.tags && offer.tags.length > 0 && (
              <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" mb={6}>
                <Heading size="md" mb={4}>Tags</Heading>
                <HStack spacing={2} flexWrap="wrap">
                  {offer.tags.map((tag) => (
                    <Tag
                      key={tag}
                      size="lg"
                      borderRadius="full"
                      bg="gray.100"
                      color="gray.700"
                    >
                      #{tag}
                    </Tag>
                  ))}
                </HStack>
              </Box>
            )}

            {/* Details Grid */}
            <Box bg="white" p={6} borderRadius="xl" boxShadow="sm">
              <Heading size="md" mb={4}>Details</Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <HStack>
                  <Icon as={MdCalendarToday} color="gray.500" boxSize={5} />
                  <Box>
                    <Text fontSize="sm" color="gray.500">Date</Text>
                    <Text fontWeight="500">{formatDate(offer.date)}</Text>
                  </Box>
                </HStack>

                <HStack>
                  <Icon as={MdAccessTime} color="gray.500" boxSize={5} />
                  <Box>
                    <Text fontSize="sm" color="gray.500">Time</Text>
                    <Text fontWeight="500">{formatTime(offer.time) || 'Not specified'}</Text>
                  </Box>
                </HStack>

                <HStack>
                  <Icon as={MdAccessTime} color="gray.500" boxSize={5} />
                  <Box>
                    <Text fontSize="sm" color="gray.500">Duration</Text>
                    <Text fontWeight="500">{offer.time_required} hour(s)</Text>
                  </Box>
                </HStack>

                <HStack>
                  <Icon as={offer.activity_type === 'group' ? MdGroup : MdPerson} color="gray.500" boxSize={5} />
                  <Box>
                    <Text fontSize="sm" color="gray.500">Activity Type</Text>
                    <Text fontWeight="500">
                      {offer.activity_type === 'group' ? 'Group Activity' : '1 to 1'}
                    </Text>
                  </Box>
                </HStack>

                {offer.activity_type === 'group' && (
                  <HStack>
                    <Icon as={MdGroup} color="gray.500" boxSize={5} />
                    <Box>
                      <Text fontSize="sm" color="gray.500">Group Size</Text>
                      <Text fontWeight="500">{offer.person_count} people</Text>
                    </Box>
                  </HStack>
                )}

                <HStack gridColumn="span 2">
                  <Icon as={MdLocationOn} color="gray.500" boxSize={5} />
                  <Box>
                    <Text fontSize="sm" color="gray.500">Location</Text>
                    <Text fontWeight="500">
                      {offer.location_type === 'remote' 
                        ? '🌐 Remote / Online' 
                        : locationAddress || offer.location || 'Not specified'}
                    </Text>
                  </Box>
                </HStack>
              </Grid>
            </Box>
          </Box>

          {/* Sidebar */}
          <VStack spacing={6} align="stretch">
            {/* Owner Card */}
            <Box bg="white" p={6} borderRadius="xl" boxShadow="sm">
              <Text fontSize="sm" color="gray.500" mb={4}>
                {offer.type === 'offer' ? 'Offered by' : 'Requested by'}
              </Text>
              <HStack spacing={4} mb={4}>
                <Avatar
                  size="lg"
                  name={`${offer.user?.first_name} ${offer.user?.last_name}`}
                  src={offer.user?.profile?.avatar}
                />
                <Box>
                  <Text fontWeight="600" fontSize="lg">
                    {offer.user?.first_name} {offer.user?.last_name}
                  </Text>
                  <HStack spacing={1}>
                    <Icon as={MdStar} color="yellow.400" />
                    <Text fontSize="sm" color="gray.600">
                      {offer.user?.profile?.rating?.toFixed(1) || '0.0'}
                    </Text>
                  </HStack>
                </Box>
              </HStack>
              
              <Divider my={4} />

              {isOwner ? (
                <Button
                  w="100%"
                  colorScheme="purple"
                  size="lg"
                  leftIcon={<Icon as={MdEdit} />}
                  onClick={() => navigate(`/create-offer?edit=${offer.id}`)}
                >
                  Edit {offer.type === 'offer' ? 'Offer' : 'Want'}
                </Button>
              ) : (
                <Button
                  w="100%"
                  bg="yellow.400"
                  color="black"
                  size="lg"
                  leftIcon={<Icon as={MdHandshake} />}
                  _hover={{ bg: 'yellow.500' }}
                  onClick={() => navigate(`/handshake/${offer.id}`)}
                >
                  {offer.type === 'offer' ? 'Request This Offer' : 'Offer Help'}
                </Button>
              )}
            </Box>

            {/* Quick Info */}
            <Box bg="white" p={6} borderRadius="xl" boxShadow="sm">
              <Heading size="sm" mb={4}>Quick Info</Heading>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text color="gray.600" fontSize="sm">Posted</Text>
                  <Text fontSize="sm" fontWeight="500">
                    {new Date(offer.created_at).toLocaleDateString()}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.600" fontSize="sm">Last Updated</Text>
                  <Text fontSize="sm" fontWeight="500">
                    {new Date(offer.updated_at).toLocaleDateString()}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.600" fontSize="sm">Duration</Text>
                  <Text fontSize="sm" fontWeight="500">{offer.time_required} hr</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Grid>
      </Container>
    </Box>
  )
}

export default OfferDetailPage

