import { apiService } from './api'
import type { TimeBankTransaction } from '@/types'

export const transactionService = {
  async getTransactions(): Promise<TimeBankTransaction[]> {
    return await apiService.get('/transactions')
  },

  async getLatestTransactions(limit: number = 10): Promise<TimeBankTransaction[]> {
    return await apiService.get(`/transactions/latest?limit=${limit}`)
  },
}

