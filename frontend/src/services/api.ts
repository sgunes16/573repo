import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import type { ApiError } from '@/types'

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api'

// Custom error class for API errors
export class ApiErrorResponse extends Error {
  constructor(
    public status: number,
    public data: ApiError
  ) {
    super(data.message || data.detail || 'An error occurred')
    this.name = 'ApiErrorResponse'
  }
}

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for cookies
    })

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // Handle 401 errors (but NOT for login/register/refresh endpoints!)
        if (
          error.response?.status === 401 && 
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/login') &&
          !originalRequest.url?.includes('/auth/register') &&
          !originalRequest.url?.includes('/auth/token/refresh')
        ) {
          originalRequest._retry = true

          try {
            // Try to refresh token
            await this.post('/auth/token/refresh')
            
            // Retry original request
            return this.client(originalRequest)
          } catch (refreshError) {
            // Redirect to login only if refresh fails
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // Return structured error
        if (error.response) {
          throw new ApiErrorResponse(
            error.response.status,
            error.response.data
          )
        }
        
        // Network or other errors
        throw new ApiErrorResponse(500, {
          message: error.message || 'Network error occurred'
        })
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

export const apiService = new ApiService()

