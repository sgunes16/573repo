import { apiService } from './api'
import type { UserProfile, UserProfileResponse, TimeBank, User } from '@/types'

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
  bio?: string
  location?: string
  skills?: string[]
  phone_number?: string
  avatar?: File
}

export interface UpdateProfileResponse {
  message: string
  user: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>
  user_profile: UserProfile
  timebank: TimeBank
}

export const profileService = {
  async getUserProfile(): Promise<[UserProfile, TimeBank]> {
    const response = await apiService.get<UserProfileResponse>('/user-profile')
    return [response.user_profile, response.timebank]
  },

  async getUserProfileDetail(userId: string): Promise<{
    user: {
      id: string
      email: string
      first_name: string
      last_name: string
    }
    profile: UserProfile | null
    recent_offers: any[]
    recent_wants: any[]
    recent_transactions: any[]
    comments: any[]
    ratings_summary: {
      avg_communication: number
      avg_punctuality: number
      total_count: number
      would_recommend_percentage: number
    } | null
  }> {
    return await apiService.get(`/user-profile/${userId}/`)
  },

  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    const formData = new FormData()
    
    if (data.first_name !== undefined) formData.append('first_name', data.first_name)
    if (data.last_name !== undefined) formData.append('last_name', data.last_name)
    if (data.bio !== undefined) formData.append('bio', data.bio)
    if (data.location !== undefined) formData.append('location', data.location)
    if (data.skills !== undefined) formData.append('skills', JSON.stringify(data.skills))
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number)
    if (data.avatar) formData.append('avatar', data.avatar)
    
    const response = await apiService.put<UpdateProfileResponse>('/user-profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  },
}