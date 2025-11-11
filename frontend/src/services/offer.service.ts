import { apiService } from './api'
import type { Offer, CreateOfferResponse } from '@/types'

export const offerService = {
  async getOffers(): Promise<Offer[]> {
    const response = await apiService.get<Offer[]>('/offers')
    return response
  },
  async createOffer(offer: Offer): Promise<CreateOfferResponse> {
    const response = await apiService.post<CreateOfferResponse>('/create-offer', offer) 
    return response
  }

}