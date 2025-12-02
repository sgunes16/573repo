import { apiService } from './api'
import type { Offer, CreateOfferResponse, UploadImageResponse } from '@/types'

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api'

export const offerService = {
  async getOffers(): Promise<Offer[]> {
    const response = await apiService.get<Offer[]>('/offers')
    return response
  },

  async getOfferById(offerId: string | number): Promise<Offer> {
    const response = await apiService.get<Offer>(`/offers/${offerId}/`)
    return response
  },

  async createOffer(offer: Offer): Promise<CreateOfferResponse> {
    const response = await apiService.post<CreateOfferResponse>('/create-offer', offer) 
    return response
  },

  async uploadImages(offerId: string | number, files: File[]): Promise<UploadImageResponse> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })

    const response = await fetch(`${API_BASE_URL}/offers/${offerId}/images/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to upload images')
    }

    return response.json()
  },

  async deleteImage(offerId: string | number, imageId: number): Promise<void> {
    await apiService.delete(`/offers/${offerId}/images/${imageId}/`)
  },

  async setPrimaryImage(offerId: string | number, imageId: number): Promise<void> {
    await apiService.post(`/offers/${offerId}/images/${imageId}/primary/`)
  },
}