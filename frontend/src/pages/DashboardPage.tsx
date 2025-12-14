import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  HStack,
  Icon,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverHeader,
  PopoverCloseButton,
  Radio,
  RadioGroup,
  Skeleton,
  SkeletonCircle,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useDisclosure,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Marker, Layer, Source } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { exchangeService } from '@/services/exchange.service'
import type { Offer, Exchange } from '@/types'
import {
  MdAdd,
  MdFilterList,
  MdLocationOn,
  MdMyLocation,
  MdPeople,
  MdSchedule,
  MdSortByAlpha,
  MdStar,
  MdWifi,
} from 'react-icons/md'
import Navbar from '@/components/Navbar'
import UserAvatar from '@/components/UserAvatar'
import { offerService } from '@/services/offer.service'
import { useGeoStore } from '@/store/useGeoStore'
import { useAuthStore } from '@/store/useAuthStore'
import { mapboxService } from '@/services/mapbox.service'

// @ts-ignore
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN

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
  <Box p={3} borderBottom="1px solid" borderColor="gray.100">
    <HStack spacing={3} align="flex-start">
      <SkeletonCircle size="10" />
      <Stack spacing={2} flex={1}>
        <HStack spacing={2}>
          <Skeleton height="18px" width="50px" borderRadius="full" />
          <Skeleton height="18px" width="70px" borderRadius="full" />
        </HStack>
        <Skeleton height="16px" width="180px" />
        <Skeleton height="12px" width="140px" />
      </Stack>
      <Stack spacing={1} align="flex-end">
        <Skeleton height="20px" width="40px" />
        <Skeleton height="12px" width="60px" />
      </Stack>
    </HStack>
  </Box>
)

const OfferCard = ({ offer, locationAddress, myExchange }: { offer: Offer; locationAddress?: string; myExchange?: Exchange }) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const rating = offer.user?.profile?.rating ?? 0
  const userName = offer.user?.first_name || 'User'
  const displayLocation = truncateLocation(locationAddress || offer.location || '', 30)

  const handleOfferClick = () => {
    if (!user) {
      navigate('/login', { state: { from: `/offer/${offer.id}` } })
    } else {
      navigate(`/offer/${offer.id}`)
    }
  }

  return (
    <Box 
      p={3}
      cursor="pointer"
      borderBottom="1px solid"
      borderColor="gray.100"
      transition="background 0.15s"
      _hover={{ bg: 'gray.50' }}
      onClick={handleOfferClick}
    >
      <HStack spacing={3} align="flex-start">
        {/* Avatar */}
        <UserAvatar
          size="md"
          user={offer.user}
          onClick={(e) => {
            e.stopPropagation()
            if (!user) {
              navigate('/login')
            } else if (offer.user?.id) {
              navigate(`/profile/${offer.user.id}`)
            }
          }}
        />
        
        {/* Content */}
        <VStack flex={1} align="stretch" spacing={1} minW={0}>
          {/* Badges Row */}
          <HStack spacing={2} flexWrap="wrap">
            {rating > 0 && (
              <HStack spacing={0.5} bg="yellow.50" px={1.5} py={0.5} borderRadius="full">
                <Icon as={MdStar} color="yellow.500" boxSize={3} />
                <Text fontSize="xs" fontWeight="600" color="yellow.700">{rating.toFixed(1)}</Text>
              </HStack>
            )}
            {myExchange && (
              <Badge
                colorScheme={
                  myExchange.status === 'COMPLETED' ? 'green' :
                  myExchange.status === 'ACCEPTED' ? 'blue' :
                  myExchange.status === 'PENDING' ? 'yellow' :
                  'gray'
                }
                fontSize="10px"
                borderRadius="full"
                px={2}
              >
                {myExchange.status === 'PENDING' ? 'REQUESTED' : myExchange.status}
              </Badge>
            )}
          </HStack>

          {/* Title */}
          <Text fontSize="sm" fontWeight="600" noOfLines={1}>
            {offer.title}
          </Text>

          {/* User & Location */}
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {userName} · {displayLocation}
          </Text>

          {/* Tags */}
          {offer.tags && offer.tags.length > 0 && (
            <HStack spacing={1}>
              {offer.tags.slice(0, 2).map(tag => (
                <Badge key={tag} size="sm" variant="outline" colorScheme="gray" fontSize="9px">
                  {tag}
                </Badge>
              ))}
              {offer.tags.length > 2 && (
                <Text fontSize="9px" color="gray.400">+{offer.tags.length - 2}</Text>
              )}
            </HStack>
          )}
        </VStack>

        {/* Right Side - Duration & Type */}
        <VStack spacing={1} align="flex-end" flexShrink={0}>
          <Badge 
            colorScheme="yellow" 
            fontSize="sm" 
            fontWeight="bold"
            px={2}
            py={0.5}
          >
            {offer.time_required}H
          </Badge>
          <Text fontSize="10px" color="gray.500">
            {offer.activity_type === '1to1' ? '1-to-1' : 'Group'}
          </Text>
          <Text fontSize="10px" color="gray.400">
            {offer.offer_type === '1time' ? 'One-time' : 'Recurring'}
          </Text>
        </VStack>
      </HStack>
    </Box>
  )
}


const MapPanel = ({ offers, radiusKm }: { offers: Offer[]; radiusKm: number }) => {
  const { geoLocation } = useGeoStore()
  const { user } = useAuthStore()
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
      
      return distance <= radiusKm
    })
  }, [offers, geoLocation, radiusKm])

  const circleGeoJson = useMemo(() => {
    if (!geoLocation || geoLocation.latitude === 0 || radiusKm < 1) return null
    
    const center = [geoLocation.longitude, geoLocation.latitude]
    const points = 64
    const coords = []
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      // Fix: dx is for longitude (needs latitude correction), dy is for latitude
      const dx = radiusKm * Math.cos(angle) / (111.32 * Math.cos(center[1] * Math.PI / 180))
      const dy = radiusKm * Math.sin(angle) / 111.32
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
  }, [geoLocation, radiusKm])

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
      h="100%"
      w="100%"
      overflow="hidden"
      position="relative"
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
                    onClick={() => {
                      if (!user) {
                        navigate('/login', { state: { from: `/offer/${offer.id}` } })
                      } else {
                        navigate(`/offer/${offer.id}`)
                      }
                    }}
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
                          <Badge
                            bg={isOffer ? '#38A169' : '#2C5282'}
                            color="white"
                            fontSize="xs"
                            textTransform="uppercase"
                          >
                            {isOffer ? 'OFFER' : 'WANT'}
                          </Badge>
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
                          if (!user) {
                            navigate('/login', { state: { from: `/offer/${offer.id}` } })
                          } else {
                            navigate(`/offer/${offer.id}`)
                          }
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
      
      {/* Legend */}
      <HStack 
        position="absolute" 
        top={4} 
        left={4} 
        bg="white" 
        px={3} 
        py={2} 
        borderRadius="lg" 
        boxShadow="md"
        spacing={4}
        fontSize="xs"
      >
        <HStack spacing={1}>
          <Box w="10px" h="10px" borderRadius="full" bg="#38A169" />
          <Text fontWeight="medium">Offers</Text>
        </HStack>
        <HStack spacing={1}>
          <Box w="10px" h="10px" borderRadius="full" bg="#2C5282" />
          <Text fontWeight="medium">Wants</Text>
        </HStack>
        <Text color="gray.500">({offersInRadius.length} nearby)</Text>
      </HStack>

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


// Filter interface
interface FilterState {
  locationType: string[] // 'remote' | 'myLocation'
  activityType: string[] // '1to1' | 'group'
  durationRange: [number, number] // [min, max] in hours
  sortBy: 'newest' | 'oldest' | 'duration_asc' | 'duration_desc'
  radiusKm: number // 0 means no filter
}

const defaultFilters: FilterState = {
  locationType: [],
  activityType: [],
  durationRange: [0, 10],
  sortBy: 'newest',
  radiusKm: 10, // Default 10km radius filter
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { geoLocation } = useGeoStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [offers, setOffers] = useState<Offer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'offers' | 'wants'>('offers')
  const [locationCache, setLocationCache] = useState<Record<string, string>>({})
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [myExchanges, setMyExchanges] = useState<Record<string, Exchange>>({}) // offer_id -> Exchange
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure()
  const fetchedRef = useRef(false) // Prevent duplicate API calls
  const lastLocationRef = useRef<string>('') // Track location to prevent duplicate fetches
  
  // Dynamic items per page based on viewport (roughly 80px per card)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  useEffect(() => {
    const calculateItemsPerPage = () => {
      const viewportHeight = window.innerHeight
      const headerHeight = 56 + 50 + 40 + 50 // navbar + search + tabs + pagination
      const availableHeight = viewportHeight - headerHeight
      const cardHeight = 85 // approximate card height
      const items = Math.max(5, Math.floor(availableHeight / cardHeight))
      setItemsPerPage(items)
    }
    
    calculateItemsPerPage()
    window.addEventListener('resize', calculateItemsPerPage)
    return () => window.removeEventListener('resize', calculateItemsPerPage)
  }, [])

  // Check if any filters are active (excluding default 10km radius)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.locationType.length > 0 ||
      filters.activityType.length > 0 ||
      filters.durationRange[0] !== 0 ||
      filters.durationRange[1] !== 10 ||
      filters.sortBy !== 'newest' ||
      filters.radiusKm !== 10 // 10km is default, not considered "active filter"
    )
  }, [filters])

  // Count active filters (excluding default 10km radius)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.locationType.length > 0) count++
    if (filters.activityType.length > 0) count++
    if (filters.durationRange[0] !== 0 || filters.durationRange[1] !== 10) count++
    if (filters.sortBy !== 'newest') count++
    if (filters.radiusKm !== 10) count++ // Only count if changed from default
    return count
  }, [filters])

  const resetFilters = () => {
    setFilters(defaultFilters)
    onFilterClose()
  }

  const fetchOffers = useCallback(async (lat?: number, lng?: number) => {
    // Create a location key to check for duplicates
    const locationKey = lat && lng ? `${lat.toFixed(4)},${lng.toFixed(4)}` : 'no-location'
    
    // Skip if we already fetched with this location
    if (lastLocationRef.current === locationKey) return
    lastLocationRef.current = locationKey
    
    setIsLoadingLocations(true)
    
    const params: { lat?: number; lng?: number } = {}
    if (lat && lng) {
      params.lat = lat
      params.lng = lng
    }
    
    const offers = await offerService.getOffers(params)
    setOffers(offers)
    
    const cache: Record<string, string> = {}
    for (const offer of offers) {
      if (offer.location_type === 'remote') {
        cache[offer.id] = 'Remote / Online'
      } else if (offer.geo_location && Array.isArray(offer.geo_location) && offer.geo_location.length === 2) {
        const [offerLat, offerLng] = offer.geo_location
        if (offerLat !== 0 && offerLng !== 0) {
          const address = await mapboxService.reverseGeocode(offerLng, offerLat)
          cache[offer.id] = address
        }
      }
    }
    setLocationCache(cache)
    setIsLoadingLocations(false)
  }, [])

  useEffect(() => {
    // Prevent React StrictMode double-call
    if (fetchedRef.current) return
    
    if (geoLocation && geoLocation.latitude !== 0) {
      // Location is ready - fetch with location
      fetchedRef.current = true
      fetchOffers(geoLocation.latitude, geoLocation.longitude)
    } else {
      // Wait for location, then fetch
      const timeout = setTimeout(() => {
        if (!fetchedRef.current) {
          fetchedRef.current = true
          // Check if location arrived in the meantime
          const currentGeo = useGeoStore.getState().geoLocation
          if (currentGeo && currentGeo.latitude !== 0) {
            fetchOffers(currentGeo.latitude, currentGeo.longitude)
          } else {
            fetchOffers()
          }
        }
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [geoLocation?.latitude, geoLocation?.longitude, fetchOffers])

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
    
    // Exclude offers where user has a completed exchange
    filtered = filtered.filter(offer => {
      const exchange = myExchanges[offer.id]
      if (exchange && exchange.status === 'COMPLETED') return false
      // Also exclude if offer itself is marked completed
      if (offer.status?.toLowerCase() === 'completed') return false
      return true
    })
    
    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter((offer) => (
        offer.title.toLowerCase().includes(searchLower) ||
        offer.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        offer.description?.toLowerCase().includes(searchLower)
      ))
    }

    // Location type filter (values: 'remote' or 'myLocation')
    if (filters.locationType.length > 0) {
      filtered = filtered.filter(offer => 
        filters.locationType.includes(offer.location_type || 'myLocation')
      )
    }

    // Activity type filter
    if (filters.activityType.length > 0) {
      filtered = filtered.filter(offer => 
        filters.activityType.includes(offer.activity_type || '1to1')
      )
    }

    // Duration range filter
    if (filters.durationRange[0] !== 0 || filters.durationRange[1] !== 10) {
      filtered = filtered.filter(offer => {
        const duration = offer.time_required || 1
        return duration >= filters.durationRange[0] && duration <= filters.durationRange[1]
      })
    }

    // Radius filter - backend returns all offers within 20km, frontend filters by selected radius
    if (geoLocation && geoLocation.latitude !== 0) {
      filtered = filtered.filter(offer => {
        // Always include remote offers
        if (offer.location_type === 'remote') return true
        
        // Check if offer has geo_location
        if (!offer.geo_location || offer.geo_location.length !== 2) return false
        
        const [offerLat, offerLng] = offer.geo_location
        if (offerLat === 0 && offerLng === 0) return false
        
        // Haversine distance calculation
        const R = 6371 // Earth's radius in km
        const dLat = (offerLat - geoLocation.latitude) * Math.PI / 180
        const dLon = (offerLng - geoLocation.longitude) * Math.PI / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(geoLocation.latitude * Math.PI / 180) * Math.cos(offerLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c
        
        return distance <= filters.radiusKm
      })
    } else {
      // User has no location - only show remote offers
      filtered = filtered.filter(offer => offer.location_type === 'remote')
    }

    // Sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'duration_asc':
        filtered.sort((a, b) => (a.time_required || 1) - (b.time_required || 1))
        break
      case 'duration_desc':
        filtered.sort((a, b) => (b.time_required || 1) - (a.time_required || 1))
        break
    }
    
    return filtered
  }, [searchQuery, offers, activeTab, filters, geoLocation, myExchanges])

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage)
  
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredOffers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredOffers, currentPage, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, filters])

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      
      {/* Desktop Layout */}
      <Flex
        display={{ base: 'none', lg: 'flex' }}
        h="calc(100vh - 56px)"
      >
        {/* Map - Desktop */}
        <Box w="50%" h="100%">
          <MapPanel offers={offers} radiusKm={filters.radiusKm} />
        </Box>

        {/* Cards Panel - Desktop */}
        <Flex 
          direction="column"
          w="50%"
          h="100%"
          overflow="hidden"
          bg="white"
          borderLeft="1px solid"
          borderColor="gray.100"
        >
          {/* Search & Filter */}
          <Box
            px={3} 
            py={2}
            borderBottom="1px solid" 
            borderColor="gray.100"
            bg="white"
            flexShrink={0}
          >
            <HStack spacing={2}>
              <Input
                flex={1}
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                size="xs"
                borderRadius="md"
                bg="gray.50"
                border="none"
                _placeholder={{ color: 'gray.400' }}
                _focus={{ bg: 'white', boxShadow: 'sm' }}
              />
              <Popover
                isOpen={isFilterOpen}
                onClose={onFilterClose}
                placement="bottom-end"
                closeOnBlur={true}
              >
                <PopoverTrigger>
                  <Button
                    leftIcon={<Icon as={MdFilterList} boxSize={4} />}
                    variant="outline"
                    size="sm"
                    color={hasActiveFilters ? 'yellow.600' : 'gray.600'}
                    borderColor={hasActiveFilters ? 'yellow.400' : 'gray.300'}
                    onClick={onFilterOpen}
                  >
                    {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
                  </Button>
                </PopoverTrigger>
                  <PopoverContent w="360px" maxH="500px" overflowY="auto">
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader fontWeight="semibold" borderBottomWidth="1px">
                      <HStack justify="space-between" pr={6}>
                        <Text>Filters</Text>
                        {hasActiveFilters && (
                          <Button size="xs" variant="ghost" colorScheme="gray" onClick={resetFilters}>
                            Reset
                          </Button>
                        )}
                      </HStack>
                    </PopoverHeader>
                    <PopoverBody>
                      <VStack spacing={4} align="stretch" py={2}>
                        {/* Location Type */}
                        <Box>
                          <Text fontWeight="semibold" fontSize="sm" mb={2}>
                            <Icon as={MdLocationOn} mr={2} />
                            Location Type
                          </Text>
                          <CheckboxGroup 
                            value={filters.locationType}
                            onChange={(values) => setFilters(prev => ({ ...prev, locationType: values as string[] }))}
                          >
                            <HStack spacing={4}>
                              <Checkbox value="remote" size="sm">
                                <HStack spacing={1}>
                                  <Icon as={MdWifi} color="blue.500" boxSize={3} />
                                  <Text fontSize="sm">Remote</Text>
                                </HStack>
                              </Checkbox>
                              <Checkbox value="myLocation" size="sm">
                                <HStack spacing={1}>
                                  <Icon as={MdLocationOn} color="green.500" boxSize={3} />
                                  <Text fontSize="sm">In-Person</Text>
                                </HStack>
                              </Checkbox>
                            </HStack>
                          </CheckboxGroup>
                        </Box>

                        <Divider />

                        {/* Activity Type */}
                        <Box>
                          <Text fontWeight="semibold" fontSize="sm" mb={2}>
                            <Icon as={MdPeople} mr={2} />
                            Activity Type
                          </Text>
                          <CheckboxGroup
                            value={filters.activityType}
                            onChange={(values) => setFilters(prev => ({ ...prev, activityType: values as string[] }))}
                          >
                            <HStack spacing={4}>
                              <Checkbox value="1to1" size="sm">1-to-1</Checkbox>
                              <Checkbox value="group" size="sm">Group</Checkbox>
                            </HStack>
                          </CheckboxGroup>
                        </Box>

                        <Divider />

                        {/* Radius Filter */}
                        <Box>
                          <Text fontWeight="semibold" fontSize="sm" mb={2}>
                            <Icon as={MdMyLocation} mr={2} />
                            Distance: {filters.radiusKm === 0 ? 'Any' : `${filters.radiusKm} km`}
                            {filters.radiusKm === 10 && <Text as="span" color="gray.400" fontWeight="normal"> (default)</Text>}
                          </Text>
                          <Slider
                            min={1}
                            max={20}
                            step={1}
                            value={filters.radiusKm}
                            onChange={(val) => setFilters(prev => ({ ...prev, radiusKm: val }))}
                            colorScheme="teal"
                            isDisabled={!geoLocation || geoLocation.latitude === 0}
                          >
                            <SliderTrack>
                              <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb boxSize={5} />
                          </Slider>
                          <HStack justify="space-between" mt={1}>
                            <Text fontSize="xs" color="gray.500">1 km</Text>
                            <Text fontSize="xs" color="gray.500">20 km</Text>
                          </HStack>
                          {(!geoLocation || geoLocation.latitude === 0) && (
                            <Text fontSize="xs" color="orange.500" mt={1}>
                              Enable location to use this filter
                            </Text>
                          )}
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            Remote offers are always shown regardless of distance.
                          </Text>
                        </Box>

                        <Divider />

                        {/* Duration Range */}
                        <Box>
                          <Text fontWeight="semibold" fontSize="sm" mb={2}>
                            <Icon as={MdSchedule} mr={2} />
                            Duration: {filters.durationRange[0]}h - {filters.durationRange[1]}h
                          </Text>
                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              variant={filters.durationRange[0] === 0 && filters.durationRange[1] === 10 ? 'solid' : 'outline'}
                              colorScheme="yellow"
                              onClick={() => setFilters(prev => ({ ...prev, durationRange: [0, 10] }))}
                            >
                              Any
                            </Button>
                            <Button
                              size="xs"
                              variant={filters.durationRange[0] === 0 && filters.durationRange[1] === 1 ? 'solid' : 'outline'}
                              colorScheme="yellow"
                              onClick={() => setFilters(prev => ({ ...prev, durationRange: [0, 1] }))}
                            >
                              &lt;1h
                            </Button>
                            <Button
                              size="xs"
                              variant={filters.durationRange[0] === 1 && filters.durationRange[1] === 3 ? 'solid' : 'outline'}
                              colorScheme="yellow"
                              onClick={() => setFilters(prev => ({ ...prev, durationRange: [1, 3] }))}
                            >
                              1-3h
                            </Button>
                            <Button
                              size="xs"
                              variant={filters.durationRange[0] === 3 && filters.durationRange[1] === 10 ? 'solid' : 'outline'}
                              colorScheme="yellow"
                              onClick={() => setFilters(prev => ({ ...prev, durationRange: [3, 10] }))}
                            >
                              3h+
                            </Button>
                          </HStack>
                        </Box>

                        <Divider />

                        {/* Sort By */}
                        <Box>
                          <Text fontWeight="semibold" fontSize="sm" mb={2}>
                            <Icon as={MdSortByAlpha} mr={2} />
                            Sort By
                          </Text>
                          <RadioGroup
                            value={filters.sortBy}
                            onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as FilterState['sortBy'] }))}
                            size="sm"
                          >
                            <HStack spacing={3} flexWrap="wrap">
                              <Radio value="newest">Newest</Radio>
                              <Radio value="oldest">Oldest</Radio>
                              <Radio value="duration_asc">Shortest</Radio>
                              <Radio value="duration_desc">Longest</Radio>
                            </HStack>
                          </RadioGroup>
                        </Box>
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
            </HStack>

            {/* Active Filters */}
            {hasActiveFilters && (
              <Wrap spacing={1} mt={2}>
                {filters.locationType.map(loc => (
                  <WrapItem key={loc}>
                    <Tag size="sm" colorScheme="yellow" borderRadius="full">
                      <TagLabel>{loc === 'remote' ? 'Remote' : 'In-Person'}</TagLabel>
                      <TagCloseButton onClick={() => setFilters(prev => ({
                        ...prev,
                        locationType: prev.locationType.filter(l => l !== loc)
                      }))} />
                    </Tag>
                  </WrapItem>
                ))}
                {filters.activityType.map(act => (
                  <WrapItem key={act}>
                    <Tag size="sm" colorScheme="blue" borderRadius="full">
                      <TagLabel>{act === '1to1' ? '1-to-1' : 'Group'}</TagLabel>
                      <TagCloseButton onClick={() => setFilters(prev => ({
                        ...prev,
                        activityType: prev.activityType.filter(a => a !== act)
                      }))} />
                    </Tag>
                  </WrapItem>
                ))}
                {(filters.durationRange[0] !== 0 || filters.durationRange[1] !== 10) && (
                  <WrapItem>
                    <Tag size="sm" colorScheme="green" borderRadius="full">
                      <TagLabel>{filters.durationRange[0]}-{filters.durationRange[1]}h</TagLabel>
                      <TagCloseButton onClick={() => setFilters(prev => ({
                        ...prev,
                        durationRange: [0, 10]
                      }))} />
                    </Tag>
                  </WrapItem>
                )}
                {filters.radiusKm !== 10 && (
                  <WrapItem>
                    <Tag size="sm" colorScheme="teal" borderRadius="full">
                      <TagLabel>{filters.radiusKm} km</TagLabel>
                      <TagCloseButton onClick={() => setFilters(prev => ({
                        ...prev,
                        radiusKm: 10
                      }))} />
                    </Tag>
                  </WrapItem>
                )}
                {filters.sortBy !== 'newest' && (
                  <WrapItem>
                    <Tag size="sm" colorScheme="purple" borderRadius="full">
                      <TagLabel>
                        {filters.sortBy === 'oldest' ? 'Oldest' : 
                         filters.sortBy === 'duration_asc' ? 'Shortest' : 'Longest'}
                      </TagLabel>
                      <TagCloseButton onClick={() => setFilters(prev => ({
                        ...prev,
                        sortBy: 'newest'
                      }))} />
                    </Tag>
                  </WrapItem>
                )}
                <WrapItem>
                  <Button size="xs" variant="link" colorScheme="gray" onClick={resetFilters}>
                    Clear
                  </Button>
                </WrapItem>
              </Wrap>
            )}
          </Box>

          {/* Tabs */}
          <HStack 
            px={3} 
            py={1.5} 
            borderBottom="1px solid" 
            borderColor="gray.100"
            justify="space-between"
            bg="white"
            flexShrink={0}
          >
            <HStack spacing={0} bg="gray.100" p={0.5} borderRadius="md">
              <Button
                size="xs"
                variant={activeTab === 'offers' ? 'solid' : 'ghost'}
                bg={activeTab === 'offers' ? 'white' : 'transparent'}
                color={activeTab === 'offers' ? 'gray.800' : 'gray.500'}
                boxShadow={activeTab === 'offers' ? 'sm' : 'none'}
                onClick={() => setActiveTab('offers')}
                fontWeight="500"
                _hover={{ bg: activeTab === 'offers' ? 'white' : 'gray.200' }}
              >
                Offers
              </Button>
              <Button 
                size="xs"
                variant={activeTab === 'wants' ? 'solid' : 'ghost'}
                bg={activeTab === 'wants' ? 'white' : 'transparent'}
                color={activeTab === 'wants' ? 'gray.800' : 'gray.500'}
                boxShadow={activeTab === 'wants' ? 'sm' : 'none'}
                onClick={() => setActiveTab('wants')}
                fontWeight="500"
                _hover={{ bg: activeTab === 'wants' ? 'white' : 'gray.200' }}
              >
                Wants
              </Button>
            </HStack>
            <Button
              size="xs"
              colorScheme="yellow"
              leftIcon={<Icon as={MdAdd} boxSize={3} />}
              onClick={() => {
                if (!user) {
                  navigate('/login')
                } else {
                  navigate(activeTab === 'offers' ? '/create-offer' : '/create-offer?type=want')
                }
              }}
            >
              Add
            </Button>
          </HStack>

          {/* Cards List */}
          <Box flex={1} overflowY="auto">
            {/* Location Warning */}
            {(!geoLocation || geoLocation.latitude === 0) && (
              <Alert status="warning" fontSize="sm" py={2}>
                <AlertIcon boxSize={4} />
                <Box>
                  <Text fontWeight="medium">Location access required</Text>
                  <Text fontSize="xs" color="gray.600">
                    Please allow location access to see nearby offers. Remote offers are still visible.
                  </Text>
                </Box>
                <Button
                  size="xs"
                  ml="auto"
                  colorScheme="yellow"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          useGeoStore.getState().setGeoLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                          })
                        },
                        (error) => {
                          console.error('Location error:', error)
                        }
                      )
                    }
                  }}
                >
                  Allow
                </Button>
              </Alert>
            )}
            
            {isLoadingLocations ? (
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
              <Flex justify="center" align="center" h="200px">
                <Text color="gray.400" fontSize="sm">No {activeTab} found.</Text>
              </Flex>
            )}
          </Box>

          {/* Pagination - Fixed at bottom */}
          {!isLoadingLocations && totalPages > 1 && (
            <HStack 
              justify="center" 
              py={2} 
              borderTop="1px solid" 
              borderColor="gray.100"
              bg="white"
              flexShrink={0}
            >
              <Button
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                isDisabled={currentPage === 1}
                variant="ghost"
              >
                ←
              </Button>
              <Text fontSize="sm" color="gray.600">
                {currentPage} / {totalPages}
              </Text>
              <Button
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                isDisabled={currentPage === totalPages}
                variant="ghost"
              >
                →
              </Button>
            </HStack>
          )}
        </Flex>
      </Flex>

      {/* Mobile Layout */}
      <Box display={{ base: 'block', lg: 'none' }}>
        {/* Map - Mobile */}
        <Box h="250px" w="100%">
          <MapPanel offers={offers} radiusKm={filters.radiusKm} />
        </Box>

        {/* Cards Panel - Mobile */}
        <Box bg="white">
          {/* Search & Filter - Mobile */}
          <Box
            px={3} 
            py={2}
            borderBottom="1px solid" 
            borderColor="gray.100"
            bg="white"
          >
            <HStack spacing={2}>
              <Input
                flex={1}
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                size="sm"
                borderRadius="md"
                bg="gray.50"
                border="none"
                _placeholder={{ color: 'gray.400' }}
              />
              <Button
                leftIcon={<Icon as={MdFilterList} boxSize={4} />}
                variant="outline"
                size="sm"
                onClick={onFilterOpen}
              >
                Filter
              </Button>
            </HStack>
          </Box>

          {/* Tabs - Mobile */}
          <HStack 
            px={3} 
            py={2} 
            borderBottom="1px solid" 
            borderColor="gray.100"
            justify="space-between"
            bg="white"
          >
            <HStack spacing={0} bg="gray.100" p={0.5} borderRadius="md">
              <Button
                size="xs"
                variant={activeTab === 'offers' ? 'solid' : 'ghost'}
                bg={activeTab === 'offers' ? 'white' : 'transparent'}
                color={activeTab === 'offers' ? 'gray.800' : 'gray.500'}
                boxShadow={activeTab === 'offers' ? 'sm' : 'none'}
                onClick={() => setActiveTab('offers')}
                fontWeight="500"
              >
                Offers
              </Button>
              <Button 
                size="xs"
                variant={activeTab === 'wants' ? 'solid' : 'ghost'}
                bg={activeTab === 'wants' ? 'white' : 'transparent'}
                color={activeTab === 'wants' ? 'gray.800' : 'gray.500'}
                boxShadow={activeTab === 'wants' ? 'sm' : 'none'}
                onClick={() => setActiveTab('wants')}
                fontWeight="500"
              >
                Wants
              </Button>
            </HStack>
            <Button
              size="xs"
              colorScheme="yellow"
              leftIcon={<Icon as={MdAdd} boxSize={3} />}
              onClick={() => {
                if (!user) {
                  navigate('/login')
                } else {
                  navigate(activeTab === 'offers' ? '/create-offer' : '/create-offer?type=want')
                }
              }}
            >
              Add
            </Button>
          </HStack>

          {/* Cards List - Mobile */}
          <Box>
            {/* Location Warning - Mobile */}
            {(!geoLocation || geoLocation.latitude === 0) && (
              <Alert status="warning" fontSize="sm" py={2}>
                <AlertIcon boxSize={4} />
                <Box flex={1}>
                  <Text fontWeight="medium" fontSize="xs">Location access required</Text>
                  <Text fontSize="xs" color="gray.600">
                    Allow location to see nearby offers.
                  </Text>
                </Box>
                <Button
                  size="xs"
                  colorScheme="yellow"
                  onClick={() => {
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
                  }}
                >
                  Allow
                </Button>
              </Alert>
            )}
            
            {isLoadingLocations ? (
              Array.from({ length: 5 }).map((_, i) => (
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
              <Flex justify="center" align="center" h="200px">
                <Text color="gray.400" fontSize="sm">No {activeTab} found.</Text>
              </Flex>
            )}
          </Box>

          {/* Pagination - Mobile */}
          {!isLoadingLocations && totalPages > 1 && (
            <HStack justify="center" py={3} borderTop="1px solid" borderColor="gray.100">
              <Button
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                isDisabled={currentPage === 1}
                variant="ghost"
              >
                ←
              </Button>
              <Text fontSize="sm" color="gray.600">
                {currentPage} / {totalPages}
              </Text>
              <Button
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                isDisabled={currentPage === totalPages}
                variant="ghost"
              >
                →
              </Button>
            </HStack>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardPage
