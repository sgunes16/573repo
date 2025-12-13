import { apiService } from './api'
import type { CreateReportData } from '@/types'

export const reportService = {
  async createReport(reportData: CreateReportData): Promise<{ message: string; report_id: number }> {
    const response = await apiService.post<{ message: string; report_id: number }>('/reports', reportData)
    return response
  },
}

