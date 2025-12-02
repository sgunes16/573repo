import {
  Box,
  Flex,
  Icon,
  IconButton,
  Image,
  Input,
  SimpleGrid,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { useCallback, useState } from 'react'
import { MdAdd, MdClose, MdStarOutline } from 'react-icons/md'

export interface UploadedImage {
  id?: number
  url: string
  file?: File
  caption?: string
  is_primary?: boolean
  isNew?: boolean
}

interface ImageUploadProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
  disabled?: boolean
}

const ImageUpload = ({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}: ImageUploadProps) => {
  const toast = useToast()

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return

      const remainingSlots = maxImages - images.length
      if (remainingSlots <= 0) {
        toast({
          title: 'Maximum images reached',
          description: `You can only upload ${maxImages} images`,
          status: 'warning',
          duration: 3000,
        })
        return
      }

      const newFiles = Array.from(files).slice(0, remainingSlots)
      const newImages: UploadedImage[] = []

      newFiles.forEach((file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not an image`,
            status: 'error',
            duration: 3000,
          })
          return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} is larger than 5MB`,
            status: 'error',
            duration: 3000,
          })
          return
        }

        const url = URL.createObjectURL(file)
        newImages.push({
          url,
          file,
          isNew: true,
          is_primary: images.length === 0 && newImages.length === 0,
        })
      })

      if (newImages.length > 0) {
        onChange([...images, ...newImages])
      }

      // Reset input
      event.target.value = ''
    },
    [images, maxImages, onChange, toast]
  )

  const handleRemove = useCallback(
    (index: number) => {
      const imageToRemove = images[index]
      
      // Revoke object URL for new images
      if (imageToRemove.isNew && imageToRemove.url) {
        URL.revokeObjectURL(imageToRemove.url)
      }

      const newImages = images.filter((_, i) => i !== index)
      
      // If removed image was primary, set first remaining as primary
      if (imageToRemove.is_primary && newImages.length > 0) {
        newImages[0].is_primary = true
      }

      onChange(newImages)
    },
    [images, onChange]
  )

  const handleSetPrimary = useCallback(
    (index: number) => {
      const newImages = images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
      onChange(newImages)
    },
    [images, onChange]
  )

  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
        {images.map((image, index) => (
          <Box
            key={image.url}
            position="relative"
            borderRadius="lg"
            overflow="hidden"
            border="2px solid"
            borderColor={image.is_primary ? 'brand.yellow.500' : 'gray.200'}
            transition="all 0.2s"
            _hover={{ borderColor: 'brand.yellow.400' }}
          >
            <Image
              src={image.url}
              alt={`Upload ${index + 1}`}
              w="100%"
              h="120px"
              objectFit="cover"
            />
            
            {/* Primary badge */}
            {image.is_primary && (
              <Box
                position="absolute"
                top={1}
                left={1}
                bg="brand.yellow.500"
                color="black"
                px={2}
                py={0.5}
                borderRadius="md"
                fontSize="xs"
                fontWeight="bold"
              >
                Primary
              </Box>
            )}

            {/* Action buttons */}
            <Flex
              position="absolute"
              top={1}
              right={1}
              gap={1}
            >
              {!image.is_primary && (
                <IconButton
                  aria-label="Set as primary"
                  icon={<Icon as={MdStarOutline} />}
                  size="xs"
                  colorScheme="yellow"
                  variant="solid"
                  onClick={() => handleSetPrimary(index)}
                  isDisabled={disabled}
                />
              )}
              <IconButton
                aria-label="Remove image"
                icon={<Icon as={MdClose} />}
                size="xs"
                colorScheme="red"
                variant="solid"
                onClick={() => handleRemove(index)}
                isDisabled={disabled}
              />
            </Flex>
          </Box>
        ))}

        {/* Add image button */}
        {images.length < maxImages && (
          <Box
            as="label"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            opacity={disabled ? 0.5 : 1}
          >
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              display="none"
              disabled={disabled}
            />
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="120px"
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="lg"
              bg="gray.50"
              transition="all 0.2s"
              _hover={!disabled ? { borderColor: 'brand.yellow.500', bg: 'gray.100' } : {}}
            >
              <Icon as={MdAdd} boxSize={8} color="gray.400" />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Add Image
              </Text>
            </Flex>
          </Box>
        )}
      </SimpleGrid>

      <Text fontSize="xs" color="gray.500">
        {images.length}/{maxImages} images • Max 5MB each • Click star to set primary image
      </Text>
    </VStack>
  )
}

export default ImageUpload

