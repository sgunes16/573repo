import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  HStack,
  Icon,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Skeleton,
  SkeletonCircle,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Map, { Marker, Layer, Source } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  getUserBadge,
} from '@/services/mock/mockData'
import { transactionService } from '@/services/transaction.service'
import { exchangeService } from '@/services/exchange.service'
import type { Offer, User, TimeBankTransaction, Exchange } from '@/types'
import {
  MdAdd,
  MdCalendarToday,
  MdFilterList,
  MdMyLocation,
  MdPeople,
  MdRepeat,
  MdSchedule,
  MdStar,
  MdSwapHoriz,
} from 'react-icons/md'
import Navbar from '@/components/Navbar'
import UserAvatar from '@/components/UserAvatar'
import { offerService } from '@/services/offer.service'
import { useGeoStore } from '@/store/useGeoStore'
import { useAuthStore } from '@/store/useAuthStore'
import { mapboxService } from '@/services/mapbox.service'

// @ts-ignore
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN
type OfferMeta = {
  date: string
  cadence: string
  duration: string
  group: string
}

const offerMetaMap: Record<string, OfferMeta> = {
  '1': { date: '11.11.2025', cadence: '1-time', duration: '1 hr.', group: '1 to 1' },
  '2': { date: '20.11.2025', cadence: 'Daily', duration: '1 hr.', group: '4 person' },
  '3': { date: '20.11.2025', cadence: 'Bi-weekly', duration: '2 hr.', group: '2 person' },
  '4': { date: '12.12.2025', cadence: '1-time', duration: '1 hr.', group: '1 to 1' },
  '5': { date: '21.12.2025', cadence: '1-time', duration: '1 hr.', group: '8 person' },
  '6': { date: '11.11.2025', cadence: 'Bi-daily', duration: '1 hr.', group: '1 to 1' },
  '7': { date: '11.11.2025', cadence: 'Daily', duration: '1 hr.', group: '1 to 1' },
}

const timeCreditTier = (credits: number) => {
  if (credits >= 1000) return '1000>'
  if (credits >= 100) return '100>'
  if (credits >= 50) return '50>'
  if (credits >= 10) return '10>'
  return '<10'
}

const RatingPill = ({ rating }: { rating: number }) => (
  <HStack
    spacing={1}
    px={2}
    py={1}
    bg="#FFFFF0"
    border="1px solid #F6E05E"
    borderRadius="3px"
    minW="60px"
    justify="center"
  >
    <Icon as={MdStar} color="#ECC94B" boxSize={4} />
    <Text fontSize="sm" fontWeight="bold" color="#ECC94B">
      {rating.toFixed(1)}
    </Text>
  </HStack>
)

const OutlinePill = ({ label }: { label: string }) => (
  <Box
    px={2}
    py={0.5}
    border="1px solid #319795"
    borderRadius="3px"
    textTransform="uppercase"
  >
    <Text fontSize="xs" fontWeight="bold" color="#2C7A7B">
      {label}
    </Text>
  </Box>
)

const truncateLocation = (location?: string, maxLength = 30): string => {
  if (!location) return 'No location'
  
  // Extract neighborhood and district from full address
  // Format: "Street, Neighborhood, District, City, Country"
  const parts = location.split(',').map(p => p.trim())
  
  // Try to get neighborhood and district (usually 2nd and 3rd parts)
  if (parts.length >= 2) {
    const shortLocation = `${parts[0]}, ${parts[1]}`
    if (shortLocation.length <= maxLength) return shortLocation
    return shortLocation.substring(0, maxLength) + '...'
  }
  
  if (location.length <= maxLength) return location
  return location.substring(0, maxLength) + '...'
}

const OfferCardSkeleton = () => (
  <Box bg="#EDF2F7" borderRadius="lg" p={4}>
    <Flex gap={4} align="flex-start">
      <Stack spacing={3} flex={1}>
        <HStack spacing={3}>
          <Skeleton height="30px" width="80px" borderRadius="md" />
          <Skeleton height="25px" width="100px" borderRadius="md" />
          <Skeleton height="25px" width="60px" borderRadius="md" />
        </HStack>
        <HStack spacing={3} align="center">
          <SkeletonCircle size="10" />
          <Stack spacing={2} flex={1}>
            <Skeleton height="20px" width="120px" />
            <HStack spacing={2}>
              <Skeleton height="18px" width="60px" borderRadius="full" />
              <Skeleton height="18px" width="70px" borderRadius="full" />
            </HStack>
          </Stack>
        </HStack>
      </Stack>
      <Stack spacing={2} align="flex-end" minW="220px">
        <HStack spacing={4}>
          <Skeleton height="16px" width="80px" />
          <Skeleton height="16px" width="70px" />
        </HStack>
        <HStack spacing={4}>
          <Skeleton height="16px" width="60px" />
          <Skeleton height="16px" width="80px" />
        </HStack>
        <Stack spacing={1} align="flex-end">
          <Skeleton height="20px" width="180px" />
          <Skeleton height="16px" width="140px" />
        </Stack>
      </Stack>
    </Flex>
  </Box>
)

const OfferCard = ({ offer, locationAddress, myExchange }: { offer: Offer; locationAddress?: string; myExchange?: Exchange }) => {
  // Badge calculation without showing time credits
  const badge = getUserBadge(offer.user?.profile?.time_credits || 0)
  const rating = offer.user?.profile?.rating ?? 4.8
  const meta = offerMetaMap[offer.id] ?? {
    date: offer.date ? new Date(offer.date).toLocaleDateString('tr-TR') : new Date(offer.created_at).toLocaleDateString('tr-TR'),
    cadence: offer.offer_type === '1time' ? 'One-time' : offer.offer_type,
    duration: `${offer.time_required} hr`,
    group: offer.activity_type === '1to1' ? '1 to 1' : `${offer.person_count} person`,
  }
  const navigate = useNavigate()

  const userName = offer.user?.first_name || 'Unknown User'
  const userLastName = offer.user?.last_name || ''
  
  const displayLocation = locationAddress || offer.location || 'No location'

  return (
    <Box 
      bg="#EDF2F7" 
      borderRadius="lg" 
      p={4} 
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
      onClick={() => navigate(`/offer/${offer.id}`)}
    >
      <Flex gap={4} align="flex-start">
        <Stack spacing={3} flex={1}>
          <HStack spacing={3} flexWrap="wrap">
            <RatingPill rating={rating} />
            <Badge
              colorScheme={badge.color as any}
              variant="subtle"
              textTransform="uppercase"
              borderRadius="2px"
              fontWeight="bold"
              fontSize="xs"
            >
              {badge.label}
            </Badge>
            {myExchange && (
              <Badge
                colorScheme={
                  myExchange.status === 'COMPLETED' ? 'green' :
                  myExchange.status === 'ACCEPTED' ? 'blue' :
                  myExchange.status === 'PENDING' ? 'yellow' :
                  myExchange.status === 'CANCELLED' ? 'red' :
                  'gray'
                }
                variant="solid"
                borderRadius="2px"
                fontWeight="bold"
                fontSize="xs"
              >
                {myExchange.status === 'PENDING' ? 'REQUESTED' : myExchange.status}
              </Badge>
            )}
          </HStack>

          <HStack spacing={3} align="center">
            <UserAvatar
              size="md"
              user={offer.user}
              cursor="pointer"
              onClick={(e) => {
                e.stopPropagation()
                if (offer.user?.id) {
                  navigate(`/profile/${offer.user.id}`)
                }
              }}
              _hover={{ opacity: 0.8 }}
            />
            <Stack spacing={0} flex={1}>
              <Text 
                fontSize="lg"
                cursor="pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  if (offer.user?.id) {
                    navigate(`/profile/${offer.user.id}`)
                  }
                }}
                _hover={{ textDecoration: 'underline' }}
              >
                {userName}
              </Text>
              <Wrap spacing={2}>
                {offer.tags && offer.tags.map(tag => (
                  <WrapItem key={tag}>
                    <Badge bg="#718096" color="white" borderRadius="2px" px={1.5}>
                      #{tag}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            </Stack>
          </HStack>
        </Stack>

        <Stack spacing={2} align="flex-end" minW="220px">
          <HStack spacing={4} color="gray.600" fontSize="xs" textTransform="uppercase">
            <HStack spacing={1}>
              <Icon as={MdCalendarToday} />
              <Text letterSpacing="0.6px">{meta.date}</Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={MdRepeat} />
              <Text letterSpacing="0.6px">{meta.cadence}</Text>
            </HStack>
          </HStack>
          <HStack spacing={4} color="gray.600" fontSize="xs" textTransform="uppercase">
            <HStack spacing={1}>
              <Icon as={MdSchedule} />
              <Text letterSpacing="0.6px">{meta.duration}</Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={MdPeople} />
              <Text letterSpacing="0.6px">{meta.group}</Text>
            </HStack>
          </HStack>
          <Stack spacing={0} textAlign="right">
            <Text fontSize="md" fontWeight="semibold">
              {offer.title}
            </Text>
            <Text fontSize="sm" fontStyle="italic" color="gray.600" title={displayLocation}>
              {truncateLocation(displayLocation)}
            </Text>
          </Stack>
        </Stack>
      </Flex>
    </Box>
  )
}

const LatestTransactionCard = ({
  transaction,
  currentUserId,
  onNavigate,
}: {
  transaction: TimeBankTransaction
  currentUserId?: string
  onNavigate: () => void
}) => {
  const isEarn = transaction.transaction_type === 'EARN' && transaction.to_user.id === currentUserId
  const otherUser = transaction.from_user.id === currentUserId ? transaction.to_user : transaction.from_user
  
  return (
    <Flex
      bg="#EDF2F7"
      borderRadius="lg"
      p={4}
      align="center"
      gap={4}
      minH="120px"
      cursor="pointer"
      _hover={{ bg: '#E2E8F0' }}
      onClick={onNavigate}
    >
      <UserAvatar 
        user={otherUser}
      />
      <Icon as={MdSwapHoriz} boxSize={8} color="gray.600" />
      <VStack align="flex-start" spacing={1} flex={1}>
        <Text fontSize="sm" fontWeight="semibold">
          {transaction.exchange?.offer.title || transaction.description}
        </Text>
        <Text fontSize="xs" color="gray.600">
          {otherUser.first_name} {otherUser.last_name}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {new Date(transaction.created_at).toLocaleDateString()}
        </Text>
      </VStack>
      <Badge
        colorScheme={isEarn ? 'green' : 'red'}
        px={3}
        py={1}
        borderRadius="md"
        fontWeight="bold"
      >
        {isEarn ? '+' : '-'}
        {transaction.time_amount}H
      </Badge>
    </Flex>
  )
}

const LatestActivityCard = ({
  from,
  to,
  service,
  hours,
}: {
  from: User
  to: User
  service: string
  hours: number
}) => (
  <Flex
    bg="#EDF2F7"
    borderRadius="lg"
    p={4}
    align="center"
    gap={4}
    minH="120px"
  >
    <UserAvatar user={from} />
    <Icon as={MdSwapHoriz} boxSize={8} color="gray.600" />
    <UserAvatar user={to} />
    <Text fontSize="sm">
      <Text as="span" color="#276749" fontWeight="semibold">
        {from.first_name}
      </Text>{' '}
      exchanged{' '}
      <Text as="span" color="#975A16" fontWeight="semibold">
        {hours} {hours > 1 ? 'hours' : 'hour'}
      </Text>{' '}
      with{' '}
      <Text as="span" color="#2B6CB0" fontWeight="semibold">
        {to.first_name}
      </Text>{' '}
      for a{' '}
      <Text as="span" color="#6B46C1" fontWeight="semibold">
        {service}
      </Text>
    </Text>
  </Flex>
)

const MapPanel = ({ offers }: { offers: Offer[] }) => {
  const { geoLocation } = useGeoStore()
  const navigate = useNavigate()
  const mapRef = useRef<MapRef>(null)
  const hasInitialized = useRef(false)
  const [viewState, setViewState] = useState({
    longitude: geoLocation?.longitude || 29.0,
    latitude: geoLocation?.latitude || 41.0,
    zoom: 13
  })

  useEffect(() => {
    if (geoLocation && geoLocation.latitude !== 0 && !hasInitialized.current) {
      setViewState({
        longitude: geoLocation.longitude,
        latitude: geoLocation.latitude,
        zoom: 13
      })
      hasInitialized.current = true
    }
  }, [geoLocation])

  useEffect(() => {
    if (!geoLocation || (geoLocation.latitude === 0 && geoLocation.longitude === 0)) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            useGeoStore.getState().setGeoLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          }
        )
      }
    }
  }, [geoLocation])

  const offersInRadius = useMemo(() => {
    if (!geoLocation || geoLocation.latitude === 0) return []
    
    return offers.filter(offer => {
      if (!offer.geo_location || !Array.isArray(offer.geo_location) || offer.geo_location.length !== 2) return false
      
      const [offerLat, offerLng] = offer.geo_location
      if (offerLat === 0 && offerLng === 0) return false
      
      const R = 6371
      const dLat = ((offerLat - geoLocation.latitude) * Math.PI) / 180
      const dLon = ((offerLng - geoLocation.longitude) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((geoLocation.latitude * Math.PI) / 180) *
          Math.cos((offerLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c
      
      return distance <= 10
    })
  }, [offers, geoLocation])

  const circleGeoJson = useMemo(() => {
    if (!geoLocation || geoLocation.latitude === 0) return null
    
    const center = [geoLocation.longitude, geoLocation.latitude]
    const radiusInKm = 10
    const points = 64
    const coords = []
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const dx = radiusInKm * Math.cos(angle) / 111.32
      const dy = radiusInKm * Math.sin(angle) / (111.32 * Math.cos(center[1] * Math.PI / 180))
      coords.push([center[0] + dx, center[1] + dy])
    }
    coords.push(coords[0])
    
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      },
      properties: {}
    }
  }, [geoLocation])

  const handleRecenter = () => {
    if (geoLocation && geoLocation.latitude !== 0) {
      setViewState({
        longitude: geoLocation.longitude,
        latitude: geoLocation.latitude,
        zoom: 13
      })
    }
  }

  return (
    <Box
      h="931px"
      borderRadius="lg"
      overflow="hidden"
      position="relative"
      boxShadow="md"
    >
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {circleGeoJson && (
          <Source id="radius-circle" type="geojson" data={circleGeoJson}>
            <Layer
              id="radius-circle-fill"
              type="fill"
              paint={{
                'fill-color': '#ECC94B',
                'fill-opacity': 0.2
              }}
            />
            <Layer
              id="radius-circle-outline"
              type="line"
              paint={{
                'line-color': '#ECC94B',
                'line-width': 2
              }}
            />
          </Source>
        )}
        
        {geoLocation && geoLocation.latitude !== 0 && (
          <Marker
            longitude={geoLocation.longitude}
            latitude={geoLocation.latitude}
            anchor="center"
          >
            <Box
              w="20px"
              h="20px"
              borderRadius="full"
              bg="#3182CE"
              border="4px solid white"
              boxShadow="0 2px 8px rgba(0,0,0,0.3)"
              position="relative"
              _after={{
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                w: '8px',
                h: '8px',
                borderRadius: 'full',
                bg: 'white',
              }}
            />
          </Marker>
        )}
        
        {offersInRadius.map((offer) => {
          if (!offer.geo_location || !Array.isArray(offer.geo_location) || offer.geo_location.length !== 2) return null
          const [offerLat, offerLng] = offer.geo_location
          if (offerLat === 0 && offerLng === 0) return null
          
          const isOffer = offer.type === 'offer'
          const borderColor = isOffer ? '#38A169' : '#2C5282' // Green for offers, Navy for wants
          const userName = offer.user?.first_name || 'U'
          const userLastName = offer.user?.last_name || ''
          const badge = getUserBadge(offer.user?.profile?.time_credits || 0)
          
          return (
            <Marker
              key={offer.id}
              longitude={offerLng}
              latitude={offerLat}
              anchor="center"
            >
              <Popover trigger="hover" placement="top" isLazy>
                <PopoverTrigger>
                  <Box
                    cursor="pointer"
                    _hover={{ transform: 'scale(1.15)' }}
                    transition="transform 0.2s"
                    onClick={() => navigate(`/offer/${offer.id}`)}
                  >
                    <UserAvatar
                      size="md"
                      user={offer.user}
                      sx={{
                        border: `4px solid ${borderColor}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    />
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  bg="white"
                  borderRadius="lg"
                  boxShadow="xl"
                  maxW="280px"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <PopoverArrow />
                  <PopoverBody p={4}>
                    <VStack align="stretch" spacing={3}>
                      <HStack spacing={3}>
                        <UserAvatar
                          size="sm"
                          user={offer.user}
                        />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">
                            {userName} {userLastName}
                          </Text>
                          <HStack spacing={2}>
                            <Badge
                              bg={isOffer ? '#38A169' : '#2C5282'}
                              color="white"
                              fontSize="xs"
                              textTransform="uppercase"
                            >
                              {isOffer ? 'OFFER' : 'WANT'}
                            </Badge>
                            <Badge
                              colorScheme={badge.color as any}
                              variant="subtle"
                              fontSize="xs"
                            >
                              {badge.label}
                            </Badge>
                          </HStack>
                        </VStack>
                      </HStack>
                      
                      <Box borderTop="1px solid" borderColor="gray.100" pt={2}>
                        <Text fontWeight="semibold" fontSize="sm" mb={1}>
                          {offer.title}
                        </Text>
                        <Text fontSize="xs" color="gray.600" noOfLines={2}>
                          {offer.description}
                        </Text>
                      </Box>
                      
                      <HStack spacing={2} flexWrap="wrap">
                        <Badge bg="#ECC94B" color="black" fontSize="xs">
                          {offer.time_required} hr
                        </Badge>
                        <Badge bg="gray.100" color="gray.700" fontSize="xs">
                          {offer.activity_type === '1to1' ? '1-to-1' : 'Group'}
                        </Badge>
                        {offer.tags && offer.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} bg="gray.600" color="white" fontSize="xs">
                            #{tag}
                          </Badge>
                        ))}
                      </HStack>
                      
                      <Button
                        size="sm"
                        bg="#ECC94B"
                        color="black"
                        fontWeight="semibold"
                        _hover={{ bg: '#D4A72C' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/offer/${offer.id}`)
                        }}
                      >
                        View Details
                      </Button>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </Marker>
          )
        })}
      </Map>
      
      <Box
        position="absolute"
        top={0}
        left={0}
        w="full"
        bg="#395F3D"
        px={6}
        py={5}
        borderBottomRadius="xl"
      >
        <HStack justify="space-between">
          <Text color="white" fontSize="lg" fontWeight="semibold">
            Hive Map ({offersInRadius.length} items nearby)
          </Text>
          <HStack spacing={3} fontSize="xs" color="white">
            <HStack spacing={1}>
              <Box w="12px" h="12px" borderRadius="full" bg="#38A169" border="2px solid white" />
              <Text>Offers</Text>
            </HStack>
            <HStack spacing={1}>
              <Box w="12px" h="12px" borderRadius="full" bg="#2C5282" border="2px solid white" />
              <Text>Wants</Text>
            </HStack>
          </HStack>
        </HStack>
      </Box>

      <Button
        position="absolute"
        bottom={4}
        right={4}
        leftIcon={<Icon as={MdMyLocation} />}
        onClick={handleRecenter}
        bg="white"
        color="gray.700"
        size="sm"
        boxShadow="lg"
        _hover={{ bg: 'gray.50' }}
        borderRadius="full"
        px={4}
      >
        My Location
      </Button>
    </Box>
  )
}


const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [offers, setOffers] = useState<Offer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'offers' | 'wants'>('offers')
  const [locationCache, setLocationCache] = useState<Record<string, string>>({})
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [latestTransactions, setLatestTransactions] = useState<TimeBankTransaction[]>([])
  const [myExchanges, setMyExchanges] = useState<Record<string, Exchange>>({}) // offer_id -> Exchange
  const itemsPerPage = 5 // Map height allows ~5 cards

  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoadingLocations(true)
      const offers = await offerService.getOffers()
      setOffers(offers)
      
      const cache: Record<string, string> = {}
      for (const offer of offers) {
        if (offer.geo_location && Array.isArray(offer.geo_location) && offer.geo_location.length === 2) {
          const [lat, lng] = offer.geo_location
          if (lat !== 0 && lng !== 0) {
            const address = await mapboxService.reverseGeocode(lng, lat)
            cache[offer.id] = address
          } else if (offer.location_type === 'remote') {
            cache[offer.id] = 'Remote / Online'
          }
        }
      }
      setLocationCache(cache)
      setIsLoadingLocations(false)
    }
    fetchOffers()
  }, [])

  // Fetch user's exchanges to show handshake status on cards
  useEffect(() => {
    const fetchMyExchanges = async () => {
      try {
        const exchanges = await exchangeService.getMyExchanges()
        const exchangeMap: Record<string, Exchange> = {}
        for (const exchange of exchanges) {
          // Map by offer_id, store the exchange where user is requester
          if (exchange.offer?.id && String(exchange.requester?.id) === String(user?.id)) {
            exchangeMap[exchange.offer.id] = exchange
          }
        }
        setMyExchanges(exchangeMap)
      } catch (error) {
        console.error('Failed to fetch exchanges:', error)
      }
    }
    if (user?.id) {
      fetchMyExchanges()
    }
  }, [user?.id])

  const filteredOffers = useMemo(() => {
    let filtered = offers.filter(offer => offer.type === activeTab.slice(0, -1)) // 'offers' -> 'offer', 'wants' -> 'want'
    
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter((offer) => (
        offer.title.toLowerCase().includes(searchLower) ||
        offer.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        offer.description?.toLowerCase().includes(searchLower)
      ))
    }
    
    return filtered
  }, [searchQuery, offers, activeTab])

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage)
  
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredOffers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredOffers, currentPage, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab])

  useEffect(() => {
    const fetchLatestTransactions = async () => {
      try {
        const data = await transactionService.getLatestTransactions(6)
        setLatestTransactions(data)
      } catch (error) {
        console.error('Failed to fetch latest transactions:', error)
      }
    }
    if (user) {
      fetchLatestTransactions()
    }
  }, [user])

  return (
    <Box bg="gray.50" minH="100vh" h="full">
      <Navbar showUserInfo={true} />
      <Container maxW="1440px" px={{ base: 4, md: 6 }} py={10} >
        <Grid
          templateColumns={{ base: '1fr', xl: '715px 1fr' }}
          gap={6}
          alignItems="flex-start"
        >
          <MapPanel offers={offers} />

          <Flex
     
            flexDirection="column"
            alignItems="flex-start"
            justifyContent="space-between"
            gap={3}
            alignSelf="center"
            h="full"
          >
            <VStack spacing={6} align="stretch" h="full" w="full">
              <Flex
                bg="#CBD5E0"
                borderRadius="xl"
                px={6}
                py={5}
                w="full"
                boxShadow="sm"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                gap={3}
                alignSelf="center"
              >
                <Input
                  w="full"
                  placeholder="Search by title, tags or description..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  bg="white"
                  borderColor="#E2E8F0"
                  h="48px"
                  fontSize="md"
                  _placeholder={{ color: '#A0AEC0' }}
                />
                <Button
                  leftIcon={<Icon as={MdFilterList} />}
                  variant="ghost"
                  fontWeight="semibold"
                  color="gray.700"
                  h="48px"
                  _hover={{ bg: 'gray.100' }}
                >
                  Filter
                </Button>
              </Flex>


              <Box bg="white" borderRadius="xl" px={6} py={5} boxShadow="sm" h="full">
                <Flex justify="space-between" align="center" mb={5}>
                  <HStack spacing={0} borderBottom="1px solid #E2E8F0">
                    <Button
                      variant="ghost"
                      borderRadius="6px 6px 0 0"
                      border={activeTab === 'offers' ? "1px solid #E2E8F0" : "none"}
                      borderBottom="none"
                      color="#B7791F"
                      bg={activeTab === 'offers' ? 'white' : 'transparent'}
                      onClick={() => setActiveTab('offers')}
                    >
                      Offers
                    </Button>
                    <Button 
                      variant="ghost"
                      borderRadius="6px 6px 0 0"
                      border={activeTab === 'wants' ? "1px solid #E2E8F0" : "none"}
                      borderBottom="none"
                      color="#B7791F"
                      bg={activeTab === 'wants' ? 'white' : 'transparent'}
                      onClick={() => setActiveTab('wants')}
                    >
                      Wants
                    </Button>
                  </HStack>
                  <Button
                    bg="#ECC94B"
                    rightIcon={<Icon as={MdAdd} />}
                    fontWeight="semibold"
                    onClick={() => navigate(activeTab === 'offers' ? '/create-offer' : '/create-offer?type=want')}
                  >
                    {activeTab === 'offers' ? 'Add New Offer' : 'Add New Want'}
                  </Button>
                </Flex>

                <VStack spacing={4} align="stretch" minH="700px">
                  {isLoadingLocations ? (
                    // Show skeletons while loading
                    Array.from({ length: itemsPerPage }).map((_, i) => (
                      <OfferCardSkeleton key={i} />
                    ))
                  ) : paginatedOffers.length > 0 ? (
                    paginatedOffers.map((offer) => (
                      <OfferCard 
                        key={offer.id} 
                        offer={offer} 
                        locationAddress={locationCache[offer.id]}
                        myExchange={myExchanges[offer.id]}
                      />
                    ))
                  ) : (
                    <Flex justify="center" align="center" minH="300px">
                      <Text color="gray.500" fontSize="lg">
                        No {activeTab} found. Try a different search term.
                      </Text>
                    </Flex>
                  )}
                </VStack>

                {!isLoadingLocations && totalPages > 1 && (
                  <Flex justify="space-between" align="center" mt={6} pt={4} borderTop="1px solid #E2E8F0">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      isDisabled={currentPage === 1}
                      variant="outline"
                      colorScheme="yellow"
                      size="sm"
                    >
                      Previous
                    </Button>
                    
                    <HStack spacing={2}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? 'solid' : 'outline'}
                          colorScheme="yellow"
                          bg={currentPage === page ? '#ECC94B' : 'transparent'}
                          color={currentPage === page ? 'black' : 'gray.600'}
                          size="sm"
                          minW="40px"
                        >
                          {page}
                        </Button>
                      ))}
                    </HStack>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      isDisabled={currentPage === totalPages}
                      variant="outline"
                      colorScheme="yellow"
                      size="sm"
                    >
                      Next
                    </Button>
                  </Flex>
                )}

                {!isLoadingLocations && (
                  <Text fontSize="sm" color="gray.500" textAlign="center" mt={3}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredOffers.length)} of {filteredOffers.length} {activeTab}
                  </Text>
                )}
              </Box>
            </VStack>
          </Flex>
        </Grid>

        <Box mt={10} px={6}>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="xl" fontWeight="semibold">
              Latest Transactions
            </Text>
            <Button
              as={Link}
              to="/transactions"
              variant="ghost"
              size="sm"
              colorScheme="blue"
            >
              View All
            </Button>
          </HStack>
          {latestTransactions.length === 0 ? (
            <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
              <Text color="gray.600">No recent transactions.</Text>
            </Box>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              {latestTransactions.map((transaction) => (
                <LatestTransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  currentUserId={user?.id}
                  onNavigate={() => navigate('/transactions')}
                />
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  )
}

export default DashboardPage
