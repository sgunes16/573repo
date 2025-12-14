import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Grid,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  List,
  ListItem,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  Tag,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import BannedBanner from '@/components/BannedBanner'
import ImageUpload, { UploadedImage } from '@/components/ImageUpload'
import { MdArrowBack, MdLocationOn, MdTag } from 'react-icons/md'
import { activity_type, location_type } from '@/types'
import { useGeoStore } from '@/store/useGeoStore'
import { useAuthStore } from '@/store/useAuthStore'
import { mapboxService } from '@/services/mapbox.service'
import { offerService } from '@/services/offer.service'

const CreateOfferPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { geoLocation } = useGeoStore()
  const { user } = useAuthStore()
  const toast = useToast()
  
  // Redirect banned users
  useEffect(() => {
    if (user?.is_banned) {
      toast({
        title: 'Account Suspended',
        description: 'You cannot create offers while your account is suspended.',
        status: 'error',
        duration: 5000,
      })
      navigate('/')
    }
  }, [user?.is_banned, navigate, toast])
  
  const editOfferId = searchParams.get('edit')
  const isEditMode = !!editOfferId
  const pageType = searchParams.get('type') === 'want' ? 'want' : 'offer'
  
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [enteredTags, setEnteredTags] = useState<string[]>([])
  const [duration, setDuration] = useState('1')
  const [activityType, setActivityType] = useState(activity_type[0])
  const [personCount, setPersonCount] = useState('1')
  const [locationType, setLocationType] = useState(location_type[0])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isLoadingOffer, setIsLoadingOffer] = useState(false)
  const [offerType, setOfferType] = useState<'offer' | 'want'>(pageType as 'offer' | 'want')
  
  const [myLocationAddress, setMyLocationAddress] = useState<string>('Loading...')
  const [otherLocationInput, setOtherLocationInput] = useState('')
  const [otherLocationCoords, setOtherLocationCoords] = useState<{ longitude: number; latitude: number; address: string } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{ longitude: number; latitude: number; address: string }>>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  // Load offer data in edit mode
  useEffect(() => {
    if (!isEditMode || !editOfferId) return
    
    const fetchOffer = async () => {
      setIsLoadingOffer(true)
      try {
        const offer = await offerService.getOfferById(editOfferId)
        
        // Pre-fill form fields
        setTitle(offer.title || '')
        setDescription(offer.description || '')
        setEnteredTags(offer.tags || [])
        setDuration(String(offer.time_required || 1))
        setActivityType((offer.activity_type as '1to1' | 'group') || '1to1')
        setPersonCount(String(offer.person_count || 1))
        setLocationType((offer.location_type as typeof location_type[number]) || 'myLocation')
        setOfferType(offer.type as 'offer' | 'want')
        
        // Handle date/time
        if (offer.date) {
          const dateStr = typeof offer.date === 'string' ? offer.date.split('T')[0] : offer.date
          setDate(dateStr)
        }
        if (offer.time) {
          const timeStr = typeof offer.time === 'string' ? offer.time.substring(0, 5) : ''
          setTime(timeStr)
        }
        
        // Handle location
        if (offer.location_type === 'otherLocation' && offer.geo_location && offer.geo_location.length === 2) {
          const address = offer.location || await mapboxService.reverseGeocode(offer.geo_location[1], offer.geo_location[0])
          setOtherLocationInput(address)
          setOtherLocationCoords({
            latitude: offer.geo_location[0],
            longitude: offer.geo_location[1],
            address
          })
        }
        
        // Load existing images
        if (offer.images && offer.images.length > 0) {
          const existingImages: UploadedImage[] = offer.images.map((img: any) => ({
            id: img.id,
            url: img.url,
            isNew: false
          }))
          setImages(existingImages)
        }
        
      } catch (error) {
        console.error('Failed to fetch offer:', error)
        toast({ title: 'Error', description: 'Failed to load offer', status: 'error', duration: 2000 })
        navigate('/dashboard')
      } finally {
        setIsLoadingOffer(false)
      }
    }
    
    fetchOffer()
  }, [editOfferId, isEditMode, navigate, toast])

  const errors = useMemo(() => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!description.trim()) errs.description = 'Description is required'
    if (locationType === 'otherLocation' && !otherLocationCoords) errs.location = 'Select a location'
    return errs
  }, [title, description, locationType, otherLocationCoords])

  const isFormValid = Object.keys(errors).length === 0
  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))
  const validateAllFields = () => setTouched({ title: true, description: true, location: true })

  useEffect(() => {
    if (!geoLocation || (geoLocation.latitude === 0 && geoLocation.longitude === 0)) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            useGeoStore.getState().setGeoLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          (error) => console.error('Error getting geolocation:', error)
        )
      }
    }
  }, [])

  useEffect(() => {
    if (locationType === 'myLocation' && geoLocation && geoLocation.latitude !== 0) {
      const fetchAddress = async () => {
        setMyLocationAddress('Loading...')
        const address = await mapboxService.reverseGeocode(geoLocation.longitude, geoLocation.latitude)
        setMyLocationAddress(address)
      }
      fetchAddress()
    }
  }, [locationType, geoLocation])

  useEffect(() => {
    if (locationType !== 'otherLocation' || !otherLocationInput.trim() || otherLocationInput.trim().length < 3) {
      setLocationSearchResults([])
      setShowLocationDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoadingLocation(true)
      const results = await mapboxService.forwardGeocode(otherLocationInput)
      setIsLoadingLocation(false)
      if (results.length > 0) {
        setLocationSearchResults(results)
        setShowLocationDropdown(true)
      } else {
        setLocationSearchResults([])
        setShowLocationDropdown(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [otherLocationInput, locationType])

  const handleSelectLocation = (location: { longitude: number; latitude: number; address: string }) => {
    setOtherLocationCoords(location)
    setOtherLocationInput(location.address)
    setShowLocationDropdown(false)
    setLocationSearchResults([])
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    validateAllFields()
    
    if (!isFormValid) {
      toast({ title: 'Fill required fields', status: 'error', duration: 2000 })
      return
    }
    
    setIsSubmitting(true)
    
    let locationData = { latitude: 0, longitude: 0, address: '' }
    
    if (locationType === 'myLocation' && geoLocation) {
      locationData = { latitude: geoLocation.latitude, longitude: geoLocation.longitude, address: myLocationAddress }
    } else if (locationType === 'otherLocation' && otherLocationCoords) {
      locationData = { latitude: otherLocationCoords.latitude, longitude: otherLocationCoords.longitude, address: otherLocationInput }
    } else if (locationType === 'remote') {
      locationData = { latitude: 0, longitude: 0, address: 'Remote / Online' }
    }
    
    const offerData = {
      type: isEditMode ? offerType : pageType,
      title,
      description,
      tags: enteredTags,
      time_required: parseInt(duration) || 1,
      location: locationData,
      activity_type: activityType,
      person_count: parseInt(personCount),
      location_type: locationType,
      date,
      time,
      status: 'ACTIVE'
    }
    
    try {
      let offerId: string
      
      if (isEditMode && editOfferId) {
        // Update existing offer
        await offerService.updateOffer(editOfferId, offerData as any)
        offerId = editOfferId
        toast({ title: 'Updated!', status: 'success', duration: 2000 })
      } else {
        // Create new offer
        const response = await offerService.createOffer(offerData as any)
        offerId = response.offer_id
        toast({ title: 'Published!', status: 'success', duration: 2000 })
      }
      
      // Upload new images
      const newImages = images.filter(img => img.isNew && img.file)
      if (newImages.length > 0 && offerId) {
        try {
          const files = newImages.map(img => img.file!).filter(Boolean)
          await offerService.uploadImages(offerId, files)
        } catch (imageError) {
          console.error('Failed to upload images:', imageError)
        }
      }
      
      navigate(isEditMode ? `/offer/${editOfferId}` : '/dashboard')
    } catch (error: any) {
      console.error('Failed to save offer:', error)
      const errorMessage = error.response?.data?.error || (isEditMode ? 'Failed to update' : 'Failed to publish')
      toast({ title: 'Error', description: errorMessage, status: 'error', duration: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingOffer) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Flex justify="center" align="center" h="50vh">
          <VStack spacing={3}>
            <Spinner size="lg" color="yellow.400" />
            <Text color="gray.500">Loading offer...</Text>
          </VStack>
        </Flex>
      </Box>
    )
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      <Box maxW="700px" mx="auto" px={4} py={6}>
        {/* Header */}
        <Flex align="center" gap={3} mb={6}>
          <Box
            as="button"
            onClick={() => navigate('/dashboard')}
            p={2}
            borderRadius="md"
            _hover={{ bg: 'gray.50' }}
          >
            <Icon as={MdArrowBack} boxSize={5} color="gray.600" />
          </Box>
          <Box>
            <Text fontWeight="600" fontSize="lg">
              {isEditMode 
                ? `Edit ${offerType === 'want' ? 'Want' : 'Offer'}`
                : pageType === 'want' ? 'New Want' : 'New Offer'}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {isEditMode 
                ? 'Update your listing'
                : pageType === 'want' ? 'Request help from the community' : 'Share your skills with the community'}
            </Text>
          </Box>
        </Flex>

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch">
            {/* Title */}
            <FormControl isInvalid={touched.title && !!errors.title}>
              <Text fontSize="sm" fontWeight="500" mb={1}>
                Title <Text as="span" color="red.400">*</Text>
              </Text>
              <Input
                placeholder={pageType === 'want' ? "What do you need?" : "What are you offering?"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleBlur('title')}
                size="sm"
                borderRadius="md"
              />
              <FormErrorMessage fontSize="xs">{errors.title}</FormErrorMessage>
            </FormControl>

            {/* Description */}
            <FormControl isInvalid={touched.description && !!errors.description}>
              <Text fontSize="sm" fontWeight="500" mb={1}>
                Description <Text as="span" color="red.400">*</Text>
              </Text>
              <Textarea
                placeholder="Provide more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleBlur('description')}
                size="sm"
                borderRadius="md"
                rows={4}
              />
              <FormErrorMessage fontSize="xs">{errors.description}</FormErrorMessage>
            </FormControl>

            {/* Images */}
            <Box>
              <Text fontSize="sm" fontWeight="500" mb={1}>Images</Text>
              <Text fontSize="xs" color="gray.500" mb={2}>Up to 5 images</Text>
              <ImageUpload images={images} onChange={setImages} maxImages={5} disabled={isSubmitting} />
            </Box>

            {/* Tags */}
            <Box>
              <Text fontSize="sm" fontWeight="500" mb={1}>Tags</Text>
              <InputGroup size="sm">
                <InputLeftElement><Icon as={MdTag} color="gray.400" boxSize={4} /></InputLeftElement>
                <Input
                  placeholder="Press Enter to add"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (tags.trim()) {
                        setEnteredTags((prev) => [...prev, tags.trim()])
                        setTags('')
                      }
                    }
                  }}
                  borderRadius="md"
                  pl={8}
                />
              </InputGroup>
              {enteredTags.length > 0 && (
                <HStack spacing={1} mt={2} flexWrap="wrap">
                  {enteredTags.map((tag, index) => (
                    <Tag
                      key={tag}
                      size="sm"
                      borderRadius="full"
                      bg="gray.100"
                      cursor="pointer"
                      onClick={() => setEnteredTags(prev => prev.filter((_, i) => i !== index))}
                      _hover={{ bg: 'gray.200' }}
                    >
                      #{tag} ✕
                    </Tag>
                  ))}
                </HStack>
              )}
            </Box>

            {/* Date & Time */}
            <Grid templateColumns="1fr 1fr" gap={3}>
              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Date</Text>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  size="sm"
                  borderRadius="md"
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Time</Text>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  size="sm"
                  borderRadius="md"
                />
              </Box>
            </Grid>

            {/* Duration & Activity Type */}
            <Grid templateColumns="1fr 1fr" gap={3}>
              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Duration (hours)</Text>
                <Select value={duration} onChange={(e) => setDuration(e.target.value)} size="sm" borderRadius="md">
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4+ hours</option>
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Type</Text>
                <RadioGroup 
                  value={activityType} 
                  onChange={(val) => {
                    // Only allow group for offers, not wants
                    if (val === 'group' && (pageType === 'want' || offerType === 'want')) {
                      return
                    }
                    setActivityType(val as '1to1' | 'group')
                  }}
                >
                  <HStack spacing={4}>
                    <Radio value="1to1" size="sm">1-to-1</Radio>
                    <Radio 
                      value="group" 
                      size="sm" 
                      isDisabled={pageType === 'want' || offerType === 'want'}
                      title={pageType === 'want' || offerType === 'want' ? "Group is only available for offers" : ""}
                    >
                      Group {(pageType === 'want' || offerType === 'want') && <Badge ml={1} fontSize="2xs" colorScheme="gray">Offers only</Badge>}
                    </Radio>
                  </HStack>
                </RadioGroup>
              </Box>
            </Grid>

            {/* Group Size */}
            {activityType === 'group' && (
              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Group Size</Text>
                <Select value={personCount} onChange={(e) => setPersonCount(e.target.value)} size="sm" borderRadius="md">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n} people</option>
                  ))}
                </Select>
              </Box>
            )}

            {/* Location */}
            <Box>
              <Text fontSize="sm" fontWeight="500" mb={1}>Location</Text>
              <RadioGroup value={locationType} onChange={(val) => setLocationType(val as typeof location_type[number])}>
                <HStack spacing={4} flexWrap="wrap">
                  <Radio value="myLocation" size="sm">My Location</Radio>
                  <Radio value="remote" size="sm">Remote</Radio>
                  <Radio value="otherLocation" size="sm">Other</Radio>
                </HStack>
              </RadioGroup>

              {locationType === 'myLocation' && geoLocation && (
                <Box mt={2} p={2} bg="gray.50" borderRadius="md" fontSize="xs">
                  <HStack><Icon as={MdLocationOn} color="yellow.500" boxSize={3} /><Text>{myLocationAddress}</Text></HStack>
                </Box>
              )}
              
              {locationType === 'remote' && (
                <Box mt={2} p={2} bg="blue.50" borderRadius="md" fontSize="xs" color="blue.600">
                  🌐 Remote / Online
                </Box>
              )}
            </Box>

            {/* Other Location Search */}
            {locationType === 'otherLocation' && (
              <FormControl isInvalid={touched.location && !!errors.location}>
                <Text fontSize="sm" fontWeight="500" mb={1}>Search Location <Text as="span" color="red.400">*</Text></Text>
                <Box position="relative">
                  <InputGroup size="sm">
                    <InputLeftElement><Icon as={MdLocationOn} color="gray.400" boxSize={4} /></InputLeftElement>
                    <Input
                      placeholder="Type to search..."
                      value={otherLocationInput}
                      onChange={(e) => {
                        setOtherLocationInput(e.target.value)
                        if (!e.target.value.trim()) {
                          setShowLocationDropdown(false)
                          setOtherLocationCoords(null)
                        }
                      }}
                      onBlur={() => handleBlur('location')}
                      borderRadius="md"
                      pl={8}
                    />
                    {isLoadingLocation && (
                      <InputRightElement><Spinner size="xs" color="yellow.500" /></InputRightElement>
                    )}
                  </InputGroup>
                  
                  {showLocationDropdown && locationSearchResults.length > 0 && (
                    <Box
                      position="absolute"
                      top="100%"
                      left={0}
                      right={0}
                      zIndex={10}
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      boxShadow="lg"
                      maxH="200px"
                      overflowY="auto"
                      mt={1}
                    >
                      <List spacing={0}>
                        {locationSearchResults.map((location, index) => (
                          <ListItem
                            key={index}
                            px={3}
                            py={2}
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            borderBottom={index < locationSearchResults.length - 1 ? '1px solid' : 'none'}
                            borderBottomColor="gray.100"
                            onClick={() => handleSelectLocation(location)}
                          >
                            <HStack spacing={2}>
                              <Icon as={MdLocationOn} color="gray.400" boxSize={4} />
                              <Text fontSize="xs" noOfLines={1}>{location.address}</Text>
                            </HStack>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
                
                {otherLocationCoords && !showLocationDropdown && (
                  <Box mt={2} p={2} bg="green.50" borderRadius="md" fontSize="xs" color="green.600">
                    ✓ {otherLocationCoords.address}
                  </Box>
                )}
                <FormErrorMessage fontSize="xs">{errors.location}</FormErrorMessage>
              </FormControl>
            )}

            {/* Submit */}
            <Button
              type="submit"
              bg="yellow.400"
              color="black"
              size="md"
              borderRadius="md"
              fontWeight="500"
              isLoading={isSubmitting || isLoadingOffer}
              loadingText={isEditMode ? "Saving..." : "Publishing..."}
              _hover={{ bg: 'yellow.500' }}
              _disabled={{ bg: 'gray.300' }}
              isDisabled={isLoadingOffer}
            >
              {isEditMode 
                ? 'Save Changes' 
                : `Publish ${pageType === 'want' ? 'Want' : 'Offer'}`}
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  )
}

export default CreateOfferPage
