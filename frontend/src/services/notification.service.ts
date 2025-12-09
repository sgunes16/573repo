import { apiService } from './api'

export interface Notification {
  id: number
  content: string
  created_at: string
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    return await apiService.get('/notifications/')
  },

  async deleteNotification(notificationId: number): Promise<{ message: string }> {
    return await apiService.delete(`/notifications/${notificationId}/`)
  },
}

