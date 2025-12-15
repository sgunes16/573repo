/**
 * Timezone-aware date/time utilities for consistent date handling
 * All dates from backend are ISO 8601 format (e.g., "2024-12-15T10:00:00+03:00")
 */

/**
 * Format an ISO datetime string to a localized date string with optional time
 * Automatically converts to user's local timezone
 * Shows time only if it's not midnight (00:00)
 */
export const formatDate = (isoString?: string | null): string => {
  if (!isoString) return 'Not specified'
  
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    const dateFormatted = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    
    // Only show time if it's not midnight (00:00)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    if (hours === 0 && minutes === 0) return dateFormatted
    
    const timeFormatted = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
    
    return `${dateFormatted}, ${timeFormatted}`
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format an ISO datetime string to a localized time string
 * Automatically converts to user's local timezone
 */
export const formatTime = (isoString?: string | null): string => {
  if (!isoString) return ''
  
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Format an ISO datetime string to a localized date and time string
 * Automatically converts to user's local timezone
 */
export const formatDateTime = (isoString?: string | null): string => {
  if (!isoString) return 'Not specified'
  
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format a date string for short display (e.g., "Dec 15" or "Dec 15, 10:00")
 * Shows time only if it's not midnight (00:00)
 */
export const formatShortDate = (isoString?: string | null): string => {
  if (!isoString) return 'TBD'
  
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return 'TBD'
    
    const dateFormatted = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    
    // Only show time if it's not midnight (00:00)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    if (hours === 0 && minutes === 0) return dateFormatted
    
    const timeFormatted = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
    
    return `${dateFormatted}, ${timeFormatted}`
  } catch {
    return 'TBD'
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (isoString?: string | null): string => {
  if (!isoString) return ''
  
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)
    
    if (Math.abs(diffMins) < 60) {
      return diffMins >= 0 ? `in ${diffMins} min` : `${Math.abs(diffMins)} min ago`
    }
    if (Math.abs(diffHours) < 24) {
      return diffHours >= 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`
    }
    return diffDays >= 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`
  } catch {
    return ''
  }
}

/**
 * Check if a date is in the past
 */
export const isPastDate = (isoString?: string | null): boolean => {
  if (!isoString) return false
  
  try {
    const date = new Date(isoString)
    return date < new Date()
  } catch {
    return false
  }
}

/**
 * Check if a date is today
 */
export const isToday = (isoString?: string | null): boolean => {
  if (!isoString) return false
  
  try {
    const date = new Date(isoString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  } catch {
    return false
  }
}

/**
 * Combine date and time inputs into ISO datetime string
 * Used when creating/updating offers
 */
export const combineDateTime = (dateStr: string, timeStr?: string): string | null => {
  if (!dateStr) return null
  
  try {
    // Parse date (YYYY-MM-DD format from date input)
    const [year, month, day] = dateStr.split('-').map(Number)
    
    let hours = 0
    let minutes = 0
    
    if (timeStr) {
      // Parse time (HH:MM format from time input)
      const [h, m] = timeStr.split(':').map(Number)
      hours = h
      minutes = m
    }
    
    // Create date in local timezone
    const date = new Date(year, month - 1, day, hours, minutes)
    
    // Return as ISO string (will include timezone offset)
    return date.toISOString()
  } catch {
    return null
  }
}

/**
 * Get user's timezone name (e.g., "Europe/Istanbul")
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

