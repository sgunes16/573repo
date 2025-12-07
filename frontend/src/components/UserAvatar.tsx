import React from 'react'
import { Avatar, AvatarProps } from '@chakra-ui/react'

interface UserAvatarProps extends Omit<AvatarProps, 'name' | 'src'> {
  user?: {
    first_name?: string
    last_name?: string
    email?: string
    profile?: {
      avatar?: string
      profile_picture?: string
    }
  } | null
  // Alternative props for direct values
  name?: string
  avatarUrl?: string
}

/**
 * Consistent avatar component that shows profile photo if available,
 * falls back to initials
 */
const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  name: directName, 
  avatarUrl: directAvatarUrl,
  ...props 
}) => {
  // Determine the name to display
  const getName = (): string => {
    if (directName) return directName
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim()
    }
    if (user?.email) return user.email
    return ''
  }

  // Determine the avatar URL
  const getAvatarUrl = (): string | undefined => {
    if (directAvatarUrl) return directAvatarUrl
    
    // Check user.profile.avatar first, then profile_picture
    const avatarPath = user?.profile?.avatar || user?.profile?.profile_picture
    
    if (!avatarPath) return undefined
    
    // If it's already a full URL, return as is
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath
    }
    
    // Otherwise, construct the full URL using MinIO/storage base URL
    const storageBaseUrl = (import.meta as any).env?.VITE_STORAGE_URL || 'http://localhost:9000'
    return `${storageBaseUrl}/${avatarPath}`
  }

  const displayName = getName()
  const avatarSrc = getAvatarUrl()

  return (
    <Avatar
      name={displayName}
      src={avatarSrc}
      {...props}
    />
  )
}

export default UserAvatar

