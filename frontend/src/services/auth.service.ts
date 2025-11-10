import { apiService } from './api'
import type { LoginCredentials, RegisterData, AuthResponse, RegisterResponse, MeResponse } from '@/types'
import type { LogoutResponse } from '@/types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials)

    return response
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiService.post<RegisterResponse>('/auth/register', data)
    return response
  },

  async logout(): Promise<LogoutResponse> {
    const response = await apiService.post<LogoutResponse>('/auth/logout')
    return response
  },

    async getCurrentUser(): Promise<MeResponse> {
    return apiService.get<MeResponse>('/auth/me')
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/token/refresh')
    return response
  },

  isAuthenticated(): boolean {
    return !!apiService.get<MeResponse>('/auth/me')
  }
}

