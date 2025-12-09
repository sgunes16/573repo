import { apiService } from './api'
import type { Report } from '@/types'

export interface KPIData {
  total_users: number
  active_offers: number
  active_wants: number
  completed_exchanges: number
  pending_reports: number
  total_time_credits: number
  recent_reports: Report[]
}

export interface UpdateReportData {
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
  admin_notes?: string
}

export interface ResolveReportData {
  action: 'remove_content' | 'ban_user' | 'warn_user' | 'dismiss'
  admin_notes?: string
}

export interface BanUserData {
  reason?: string
  duration_days?: number
}

export interface WarnUserData {
  message: string
}

export const adminService = {
  async getKPI(): Promise<KPIData> {
    return await apiService.get('/admin/kpi/')
  },

  async getReports(): Promise<Report[]> {
    return await apiService.get('/admin/reports/')
  },

  async updateReport(reportId: number, data: UpdateReportData): Promise<{ message: string; report: any }> {
    return await apiService.patch(`/admin/reports/${reportId}/`, data)
  },

  async resolveReport(reportId: number, data: ResolveReportData): Promise<{ message: string; report_id: number; status: string }> {
    return await apiService.post(`/admin/reports/${reportId}/resolve/`, data)
  },

  async banUser(userId: number, data: BanUserData): Promise<{ message: string; user: any; reason?: string; duration_days?: number }> {
    return await apiService.post(`/admin/users/${userId}/ban/`, data)
  },

  async warnUser(userId: number, data: WarnUserData): Promise<{ message: string; user: any }> {
    return await apiService.post(`/admin/users/${userId}/warn/`, data)
  },

  async deleteOffer(offerId: number): Promise<{ message: string; offer: any }> {
    return await apiService.delete(`/admin/offers/${offerId}/`)
  },

  async getExchangeDetail(exchangeId: number): Promise<any> {
    return await apiService.get(`/admin/exchanges/${exchangeId}/`)
  },
}

