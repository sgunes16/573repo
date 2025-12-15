/**
 * Location formatting utilities for consistent address display
 */

/**
 * Parse an address into components
 * Typical formats:
 * - "Fatih, Yakacık Caddesi 185, 34870 Kartal/İstanbul, Türkiye"
 * - "Some Street 123, District, City, Country"
 */
interface AddressParts {
  street?: string
  district?: string
  city?: string
  country?: string
  full: string
}

export const parseAddress = (address: string): AddressParts => {
  if (!address) return { full: '' }
  
  const parts = address.split(',').map(p => p.trim())
  
  if (parts.length >= 4) {
    return {
      street: parts[1], // Usually street name
      district: parts[0], // Usually neighborhood/district
      city: parts[2]?.split('/')[0]?.replace(/^\d+\s*/, ''), // Remove postal code
      country: parts[parts.length - 1],
      full: address
    }
  } else if (parts.length >= 2) {
    return {
      district: parts[0],
      city: parts[1],
      full: address
    }
  }
  
  return { full: address }
}

/**
 * Format location for short display
 * Shows district + city if available, otherwise truncates
 * @param address Full address string
 * @param maxLength Maximum length before truncation (default: 25)
 */
export const formatLocationShort = (address?: string | null, maxLength: number = 25): string => {
  if (!address) return 'Not specified'
  if (address === 'Remote' || address === 'Remote / Online') return 'Remote'
  
  const parts = parseAddress(address)
  
  // Try to create a short, meaningful display
  if (parts.district && parts.city) {
    const short = `${parts.district}, ${parts.city}`
    if (short.length <= maxLength) return short
  }
  
  if (parts.district) {
    if (parts.district.length <= maxLength) return parts.district
  }
  
  // Fallback: truncate the full address
  if (address.length <= maxLength) return address
  return address.substring(0, maxLength - 3) + '...'
}

/**
 * Format location for medium display (card view)
 * Shows more detail than short, but still truncated if needed
 * @param address Full address string
 * @param maxLength Maximum length (default: 35)
 */
export const formatLocationMedium = (address?: string | null, maxLength: number = 35): string => {
  if (!address) return 'Not specified'
  if (address === 'Remote' || address === 'Remote / Online') return 'Remote / Online'
  
  const parts = parseAddress(address)
  
  // Try district + street
  if (parts.district && parts.street) {
    const medium = `${parts.district}, ${parts.street}`
    if (medium.length <= maxLength) return medium
  }
  
  // Try district + city
  if (parts.district && parts.city) {
    const medium = `${parts.district}, ${parts.city}`
    if (medium.length <= maxLength) return medium
  }
  
  // Fallback
  if (address.length <= maxLength) return address
  return address.substring(0, maxLength - 3) + '...'
}

/**
 * Check if address needs tooltip (i.e., was truncated or has more info)
 */
export const needsTooltip = (address?: string | null, displayLength: number = 25): boolean => {
  if (!address) return false
  if (address === 'Remote' || address === 'Remote / Online') return false
  return address.length > displayLength
}

/**
 * Get a clean full address for tooltip display
 */
export const getFullAddress = (address?: string | null): string => {
  if (!address) return ''
  if (address === 'Remote' || address === 'Remote / Online') return 'Remote / Online'
  return address
}

