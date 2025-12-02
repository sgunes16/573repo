import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormErrorMessage,
  Grid,
  Heading,
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
  Stack,
  Tag,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import ImageUpload, { UploadedImage } from '@/components/ImageUpload'
import { MdCalendarToday, MdLocationOn, MdTag } from 'react-icons/md'
import { mockOffers } from '@/services/mock/mockData'
import { activity_type, offer_type, location_type } from '@/types'
import { useGeoStore } from '@/store/useGeoStore'
import { mapboxService } from '@/services/mapbox.service'
import { offerService } from '@/services/offer.service'

const CreateOfferPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { geoLocation } = useGeoStore()
  const toast = useToast()
  
  const pageType = searchParams.get('type') === 'want' ? 'want' : 'offer'
  
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [enteredTags, setEnteredTags] = useState<string[]>([])
  const [duration, setDuration] = useState('1 hr.')
  const [activityType, setActivityType] = useState(activity_type[0])
  const [offerType, setOfferType] = useState(offer_type[0])
  const [personCount, setPersonCount] = useState('1')
  const [locationType, setLocationType] = useState(location_type[0])
  const [fromDate, setFromDate] = useState('2025-11-11T08:00')
  const [toDate, setToDate] = useState('2025-11-11T09:00')
  const [date, setDate] = useState('2025-11-11')
  const [time, setTime] = useState('08:00')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const [myLocationAddress, setMyLocationAddress] = useState<string>('Loading...')
  const [otherLocationInput, setOtherLocationInput] = useState('')
  const [otherLocationCoords, setOtherLocationCoords] = useState<{ longitude: number; latitude: number; address: string } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{ longitude: number; latitude: number; address: string }>>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  const relatedOffers = useMemo(() => mockOffers.slice(0, 2), [])

  // Validation logic
  const errors = useMemo(() => {
    const errs: Record<string, string> = {}
    
    if (!title.trim()) {
      errs.title = 'Title is required'
    }
    
    if (!description.trim()) {
      errs.description = 'Description is required'
    }
    
    if (locationType === 'otherLocation' && !otherLocationCoords) {
      errs.location = 'Please select a location from the dropdown'
    }
    
    return errs
  }, [title, description, locationType, otherLocationCoords])

  const isFormValid = Object.keys(errors).length === 0

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const validateAllFields = () => {
    setTouched({
      title: true,
      description: true,
      location: true,
    })
  }

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
          (error) => {
            console.error('Error getting geolocation:', error)
          }
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
    if (locationType !== 'otherLocation' || !otherLocationInput.trim()) {
      setLocationSearchResults([])
      setShowLocationDropdown(false)
      return
    }

    if (otherLocationInput.trim().length < 3) {
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
    
    // Validate all fields on submit
    validateAllFields()
    
    if (!isFormValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      })
      return
    }
    
    setIsSubmitting(true)
    
    let locationData = {
      latitude: 0,
      longitude: 0,
      address: ''
    }
    
    if (locationType === 'myLocation' && geoLocation) {
      locationData = {
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
        address: myLocationAddress
      }
    } else if (locationType === 'otherLocation' && otherLocationCoords) {
      locationData = {
        latitude: otherLocationCoords.latitude,
        longitude: otherLocationCoords.longitude,
        address: otherLocationInput
      }
    } else if (locationType === 'remote') {
      locationData = {
        latitude: 0,
        longitude: 0,
        address: 'Remote / Online'
      }
    }
    
    const durationHours = parseInt(duration.replace(/[^0-9]/g, '')) || 1
    
    const offerData = {
      type: pageType,
      title,
      description,
      tags: enteredTags,
      time_required: durationHours,
      location: locationData,
      activity_type: activityType,
      offer_type: offerType,
      person_count: parseInt(personCount),
      location_type: locationType,
      date,
      time,
      from_date: fromDate,
      to_date: toDate,
      status: 'ACTIVE'
    }
    
    try {
      // Create the offer first
      const response = await offerService.createOffer(offerData as any)
      console.log('Offer created:', response)
      
      // Upload images if any
      const newImages = images.filter(img => img.isNew && img.file)
      if (newImages.length > 0 && response.offer_id) {
        try {
          const files = newImages.map(img => img.file!).filter(Boolean)
          await offerService.uploadImages(response.offer_id, files)
          toast({
            title: 'Success!',
            description: `${pageType === 'want' ? 'Want' : 'Offer'} created with ${files.length} image(s)`,
            status: 'success',
            duration: 3000,
          })
        } catch (imageError) {
          console.error('Failed to upload images:', imageError)
          toast({
            title: 'Partial Success',
            description: `${pageType === 'want' ? 'Want' : 'Offer'} created but images failed to upload`,
            status: 'warning',
            duration: 3000,
          })
        }
      } else {
        toast({
          title: 'Success!',
          description: `${pageType === 'want' ? 'Want' : 'Offer'} created successfully`,
          status: 'success',
          duration: 3000,
        })
      }
      
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to create offer:', error)
      toast({
        title: 'Error',
        description: `Failed to create ${pageType}. Please try again.`,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      <Container maxW="960px" py={10} px={{ base: 4, md: 8 }}>
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          <Box as="form" onSubmit={handleSubmit}>
            <Heading fontSize="2xl" mb={6}>
              {pageType === 'want' ? 'Publish a New Want' : 'Publish a New Offer'}
            </Heading>
            <VStack spacing={6} align="stretch">
              <FormControl isInvalid={touched.title && !!errors.title}>
                <Text fontWeight="600" mb={1}>Title <Text as="span" color="red.500">*</Text></Text>
                <Input
                  placeholder={pageType === 'want' ? "What do you need help with?" : "Give your offer a short name"}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onBlur={() => handleBlur('title')}
                  h="48px"
                  borderRadius="lg"
                />
                <FormErrorMessage>{errors.title}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={touched.description && !!errors.description}>
                <Text fontWeight="600" mb={1}>Description <Text as="span" color="red.500">*</Text></Text>
                <Textarea
                  placeholder={pageType === 'want' ? "Describe what kind of help you're looking for" : "Describe the skills or support you want to share"}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  onBlur={() => handleBlur('description')}
                  borderRadius="lg"
                  minH="120px"
                />
                <FormErrorMessage>{errors.description}</FormErrorMessage>
              </FormControl>

              <Stack spacing={2}>
                <Text fontWeight="600">Images</Text>
                <Text fontSize="sm" color="gray.500">
                  Add up to 5 images to showcase your {pageType}
                </Text>
                <ImageUpload
                  images={images}
                  onChange={setImages}
                  maxImages={5}
                  disabled={isSubmitting}
                />
              </Stack>

              <Stack spacing={2}>
                <Text fontWeight="600">Tags</Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={MdTag} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Press Enter to add tags (e.g. #music, #piano)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        if (tags.trim()) {
                          setEnteredTags((prev) => [...prev, tags.trim()])
                          setTags('')
                        }
                      }
                    }}
                    h="48px"
                    borderRadius="lg"
                    pl="50px"
                  />
                </InputGroup>
                <HStack spacing={2} flexWrap="wrap">
                  {enteredTags.map((tag, index) => (
                    <Tag 
                      key={tag} 
                      borderRadius="full" 
                      bg="#EDF2F7" 
                      color="gray.700"
                      cursor="pointer"
                      onClick={() => setEnteredTags(prev => prev.filter((_, i) => i !== index))}
                      _hover={{ bg: '#E2E8F0' }}
                    >
                      #{tag} ✕
                    </Tag>
                  ))}
                </HStack>
              </Stack>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <Stack spacing={1}>
                  <Text fontWeight="600">Date</Text>
                  <Input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    h="48px"
                    borderRadius="lg"
                  />
                </Stack>
                <Stack spacing={1}>
                  <Text fontWeight="600">Time</Text>
                  <Input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    h="48px"
                    borderRadius="lg"
                  />
                </Stack>
              </Grid>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <Stack spacing={1}>
                  <Text fontWeight="600">Starts</Text>
                  <Input
                    type="datetime-local"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    h="48px"
                    borderRadius="lg"
                  />
                </Stack>
                <Stack spacing={1}>
                  <Text fontWeight="600">Ends</Text>
                  <Input
                    type="datetime-local"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    h="48px"
                    borderRadius="lg"
                  />
                </Stack>
              </Grid>

              <Stack spacing={1}>
                <Text fontWeight="600">Duration</Text>
                <Select value={duration} onChange={(event) => setDuration(event.target.value)} h="48px" borderRadius="lg">
                  <option value="30 min.">30 min.</option>
                  <option value="1 hr.">1 hr.</option>
                  <option value="2 hr.">2 hr.</option>
                  <option value="Half-day">Half-day</option>
                </Select>
              </Stack>

              <Stack spacing={1}>
                <Text fontWeight="600">Activity Type</Text>
                <RadioGroup value={activityType} onChange={(val) => setActivityType(val as '1to1' | 'group')}>
                  <Stack direction="row" spacing={6}>
                    <Radio value="1to1">1 to 1</Radio>
                    <Radio value="group">Group Activity</Radio>
                  </Stack>
                </RadioGroup>
              </Stack>

              <Stack spacing={1}>
                <Text fontWeight="600">Offer Cadence</Text>
                <Select value={offerType} onChange={(event) => setOfferType(event.target.value)} h="48px" borderRadius="lg">
                  <option value="1time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </Stack>

              <Stack spacing={1}>
                <Text fontWeight="600">Group Size</Text>
                <Select
                  value={personCount}
                  onChange={(event) => setPersonCount(event.target.value)}
                  h="48px"
                  borderRadius="lg"
                  isDisabled={activityType === '1to1'}
                >
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4 people</option>
                  <option value="5">5 people</option>
                </Select>
              </Stack>

              <Stack spacing={1}>
                <Text fontWeight="600">Location</Text>
                <RadioGroup value={locationType} onChange={(val) => setLocationType(val as typeof location_type[number])}>
                  <Stack direction={{ base: 'column', md: 'row' }}>
                    <Radio value="myLocation">Use my location</Radio>
                    <Radio value="remote">Remote / Online</Radio>
                    <Radio value="otherLocation">Other Location</Radio>
                  </Stack>
                </RadioGroup>

                {locationType === 'myLocation' && geoLocation && (
                  <Box mt={2} p={3} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
                    <HStack>
                      <Icon as={MdLocationOn} color="brand.yellow.500" />
                      <Text fontSize="sm" color="gray.700">
                        {myLocationAddress}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Lat: {geoLocation.latitude.toFixed(6)}, Long: {geoLocation.longitude.toFixed(6)}
                    </Text>
                  </Box>
                )}
                
                {locationType === 'remote' && (
                  <Box mt={2} p={3} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.200">
                    <Text fontSize="sm" color="blue.700">
                      🌐 This offer will be marked as remote/online (no physical location)
                    </Text>
                  </Box>
                )}
              </Stack>

              {locationType === 'otherLocation' && (
                <FormControl isInvalid={touched.location && !!errors.location}>
                  <Text fontWeight="600" mb={1}>Other Location <Text as="span" color="red.500">*</Text></Text>
                  <Box position="relative">
                    <InputGroup>
                      <InputLeftElement h="48px" pointerEvents="none">
                        <Icon as={MdLocationOn} color="gray.400" />
                      </InputLeftElement>
                      <Input 
                        placeholder="Type to search location (min. 3 characters)" 
                        value={otherLocationInput}
                        onChange={(e) => {
                          setOtherLocationInput(e.target.value)
                          if (!e.target.value.trim()) {
                            setShowLocationDropdown(false)
                            setOtherLocationCoords(null)
                          }
                        }}
                        onBlur={() => handleBlur('location')}
                        h="48px" 
                        borderRadius="lg"
                        pr={isLoadingLocation ? '40px' : '12px'}
                      />
                      {isLoadingLocation && (
                        <InputRightElement h="48px">
                          <Spinner size="sm" color="brand.yellow.500" />
                        </InputRightElement>
                      )}
                    </InputGroup>
                    
                    {showLocationDropdown && locationSearchResults.length > 0 && (
                      <Box
                        position="absolute"
                        top="calc(100% + 4px)"
                        left={0}
                        right={0}
                        zIndex={10}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="lg"
                        boxShadow="lg"
                        maxH="300px"
                        overflowY="auto"
                      >
                        <List spacing={0}>
                          {locationSearchResults.map((location, index) => (
                            <ListItem
                              key={index}
                              px={4}
                              py={3}
                              cursor="pointer"
                              _hover={{ bg: 'gray.50' }}
                              borderBottom={index < locationSearchResults.length - 1 ? '1px solid' : 'none'}
                              borderBottomColor="gray.100"
                              onClick={() => handleSelectLocation(location)}
                            >
                              <HStack spacing={3}>
                                <Icon as={MdLocationOn} color="gray.400" boxSize={5} />
                                <Box flex={1}>
                                  <Text fontSize="sm" fontWeight="500" color="gray.800">
                                    {location.address}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500" mt={0.5}>
                                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                                  </Text>
                                </Box>
                              </HStack>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                  
                  {otherLocationCoords && !showLocationDropdown && (
                    <Box p={3} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.200">
                      <HStack>
                        <Icon as={MdLocationOn} color="green.500" />
                        <Text fontSize="sm" color="green.700">
                          Location selected!
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Lat: {otherLocationCoords.latitude.toFixed(6)}, Long: {otherLocationCoords.longitude.toFixed(6)}
                      </Text>
                    </Box>
                  )}
                  <FormErrorMessage>{errors.location}</FormErrorMessage>
                </FormControl>
              )}

              <Button 
                type="submit" 
                bg="#ECC94B" 
                color="black" 
                h="52px" 
                borderRadius="xl" 
                fontWeight="600"
                isLoading={isSubmitting}
                loadingText="Publishing..."
                isDisabled={isSubmitting}
                _disabled={{ bg: 'gray.300', cursor: 'not-allowed' }}
              >
                {pageType === 'want' ? 'Publish My Want' : 'Publish My Offer'}
              </Button>
            </VStack>
          </Box>

          <Box bg="#F7FAFC" borderRadius="2xl" p={6} border="1px solid #E2E8F0">
            <Heading size="md" mb={4}>
              {pageType === 'want' ? 'Want Tips' : 'Offer Tips'}
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={4}>
              {pageType === 'want' 
                ? 'A clear title and detailed description help neighbors understand what you need. Add tags so your want is easy to discover.'
                : 'A clear title and detailed description help neighbors understand what you provide. Add tags so your offer is easy to discover.'
              }
            </Text>
            <Divider my={4} />
            <Heading size="sm" mb={3}>
              Similar Offers
            </Heading>
            <VStack spacing={4} align="stretch">
              {relatedOffers.map((offer) => (
                <Box key={offer.id} bg="white" borderRadius="md" p={3} border="1px solid #E2E8F0">
                  <Text fontWeight="600">{offer.title}</Text>
                  <HStack spacing={2} color="gray.600" fontSize="sm" mt={1}>
                    <Icon as={MdCalendarToday} />
                    <Text>{new Date(offer.created_at).toLocaleDateString()}</Text>
                  </HStack>
                  <HStack spacing={2} mt={2}>
                    {offer.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} colorScheme="gray" variant="subtle">
                        #{tag}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        </Grid>
      </Container>
    </Box>
  )
}

export default CreateOfferPage
