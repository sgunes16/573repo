import { apiService } from './api'
import type { Exchange, ExchangeRating } from '@/types'

export interface CreateExchangeData {
  offer_id: string
}

export interface ProposeDateTimeData {
  date: string  // YYYY-MM-DD
  time?: string // HH:MM
}

export interface SubmitRatingData {
  communication: number  // 1-5
  punctuality: number   // 1-5
  would_recommend: boolean
  comment?: string
}

export const exchangeService = {
  async createExchange(data: CreateExchangeData): Promise<{ message: string; exchange_id: number; time_frozen: number }> {
    return await apiService.post('/exchanges/', data)
  },

  async getExchange(exchangeId: string): Promise<Exchange> {
    return await apiService.get(`/exchanges/${exchangeId}/`)
  },

  async getMyExchanges(): Promise<Exchange[]> {
    return await apiService.get('/my-exchanges/')
  },

  async getExchangeByOfferId(offerId: string): Promise<Exchange | null> {
    try {
      return await apiService.get(`/exchanges/by-offer/${offerId}/`)
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async getExchangesForOffer(offerId: string): Promise<Exchange[]> {
    return await apiService.get(`/exchanges/for-offer/${offerId}/`)
  },

  async proposeDateTime(exchangeId: string, data: ProposeDateTimeData): Promise<{ message: string; proposed_date: string; proposed_time?: string }> {
    return await apiService.post(`/exchanges/${exchangeId}/propose-datetime/`, data)
  },

  async acceptExchange(exchangeId: string): Promise<{ message: string; status: string }> {
    return await apiService.post(`/exchanges/${exchangeId}/accept/`)
  },

  async rejectExchange(exchangeId: string): Promise<{ message: string; status: string }> {
    return await apiService.post(`/exchanges/${exchangeId}/reject/`)
  },

  async cancelExchange(exchangeId: string): Promise<{ message: string; status: string }> {
    return await apiService.post(`/exchanges/${exchangeId}/cancel/`)
  },

  async confirmCompletion(exchangeId: string): Promise<{ message: string; requester_confirmed: boolean; provider_confirmed: boolean; status: string }> {
    return await apiService.post(`/exchanges/${exchangeId}/confirm-completion/`)
  },

  async submitRating(exchangeId: string, data: SubmitRatingData): Promise<{ message: string; rating: ExchangeRating }> {
    return await apiService.post(`/exchanges/${exchangeId}/rate/`, data)
  },
}

