import { Text, Tooltip, TextProps } from '@chakra-ui/react'
import { formatLocationShort, formatLocationMedium, needsTooltip, getFullAddress } from '../utils/location'

interface LocationDisplayProps extends Omit<TextProps, 'children'> {
  address?: string | null
  size?: 'short' | 'medium' | 'full'
  maxLength?: number
  showTooltip?: boolean
}

/**
 * Smart location display component with optional tooltip
 * Automatically truncates long addresses and shows full address on hover
 */
export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  address,
  size = 'short',
  maxLength,
  showTooltip = true,
  ...textProps
}) => {
  const defaultMaxLength = size === 'short' ? 22 : size === 'medium' ? 35 : 100
  const effectiveMaxLength = maxLength ?? defaultMaxLength
  
  const displayText = size === 'full' 
    ? getFullAddress(address) 
    : size === 'medium'
      ? formatLocationMedium(address, effectiveMaxLength)
      : formatLocationShort(address, effectiveMaxLength)
  
  const fullAddress = getFullAddress(address)
  const shouldShowTooltip = showTooltip && needsTooltip(address, effectiveMaxLength)
  
  const textElement = (
    <Text 
      noOfLines={1}
      cursor={shouldShowTooltip ? 'help' : 'default'}
      {...textProps}
    >
      {displayText}
    </Text>
  )
  
  if (shouldShowTooltip) {
    return (
      <Tooltip 
        label={fullAddress} 
        placement="top"
        hasArrow
        bg="gray.700"
        color="white"
        fontSize="xs"
        px={3}
        py={2}
        borderRadius="md"
        maxW="300px"
      >
        {textElement}
      </Tooltip>
    )
  }
  
  return textElement
}

export default LocationDisplay

