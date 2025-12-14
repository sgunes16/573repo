import { apiService } from './api'
import type { Offer, CreateOfferResponse, UploadImageResponse } from '@/types'

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api'

interface GetOffersParams {
  lat?: number
  lng?: number
}

export const offerService = {
  async getOffers(params?: GetOffersParams): Promise<Offer[]> {
    const queryParams = new URLSearchParams()
    if (params?.lat !== undefined) queryParams.append('lat', params.lat.toString())
    if (params?.lng !== undefined) queryParams.append('lng', params.lng.toString())
    
    const queryString = queryParams.toString()
    const url = queryString ? `/offers?${queryString}` : '/offers'
    
    const response = await apiService.get<Offer[]>(url)
    return response
  },

  async getOfferById(offerId: string | number): Promise<Offer> {
    const response = await apiService.get<Offer>(`/offers/${offerId}`)
    return response
  },

  async createOffer(offer: Offer): Promise<CreateOfferResponse> {
    const response = await apiService.post<CreateOfferResponse>('/create-offer', offer) 
    return response
  },

  async updateOffer(offerId: string | number, offer: Partial<Offer>): Promise<CreateOfferResponse> {
    const response = await apiService.put<CreateOfferResponse>(`/offers/${offerId}`, offer)
    return response
  },

  async uploadImages(offerId: string | number, files: File[]): Promise<UploadImageResponse> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })

    const response = await fetch(`${API_BASE_URL}/offers/${offerId}/images`, {
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
    await apiService.delete(`/offers/${offerId}/images/${imageId}`)
  },

  async setPrimaryImage(offerId: string | number, imageId: number): Promise<void> {
    await apiService.post(`/offers/${offerId}/images/${imageId}/primary`)
  },
}