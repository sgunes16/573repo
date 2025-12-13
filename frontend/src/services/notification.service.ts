import { apiService } from './api'

export interface Notification {
  id: number
  content: string
  is_read: boolean
  created_at: string
}

export const notificationService = {
  async getNotifications(isRead?: boolean): Promise<Notification[]> {
    const params = isRead !== undefined ? `?is_read=${isRead}` : ''
    return await apiService.get(`/notifications${params}`)
  },

  async getUnreadNotifications(): Promise<Notification[]> {
    return await apiService.get('/notifications?is_read=false')
  },

  async markAsRead(notificationId: number): Promise<Notification> {
    return await apiService.patch(`/notifications/${notificationId}`, { is_read: true })
  },

  async markAsUnread(notificationId: number): Promise<Notification> {
    return await apiService.patch(`/notifications/${notificationId}`, { is_read: false })
  },

  async markAllAsRead(): Promise<{ message: string }> {
    return await apiService.post('/notifications/mark-all-read')
  },

  async deleteNotification(notificationId: number): Promise<{ message: string }> {
    return await apiService.delete(`/notifications/${notificationId}`)
  },
}

