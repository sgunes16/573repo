import { apiService } from './api'
import type { UserProfile, UserProfileResponse, TimeBank } from '@/types'

export const profileService = {
  async getUserProfile(): Promise<[UserProfile, TimeBank]> {
    const response = await apiService.get<UserProfileResponse>('/user-profile')
    return [response.user_profile, response.timebank]
  },

}