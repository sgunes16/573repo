import { create } from 'zustand'
import type { AuthResponse, LoginCredentials, RegisterData, User } from '@/types'
import { authService } from '@/services/auth.service'
import { ApiErrorResponse } from '@/services/api'

interface AuthState {
  authUser: AuthResponse | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setAuthUser: (authUser: AuthResponse | null) => void
  setUser: (user: User | null) => void
  setError: (error: string | null) => void
  login: (credentials: LoginCredentials) => Promise<void>
  register: (registerData: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  authUser: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setAuthUser: (authUser) =>
    set({ authUser, isAuthenticated: !!authUser }),

  setUser: (user) =>
    set({ user }),

  setError: (error) =>
    set({ error }),

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null })
    try {
      const authResponse = await authService.login(credentials)
      // User info is already in login response, no need to call getCurrentUser
      set({ 
        authUser: authResponse, 
        user: authResponse.user as User,
        isAuthenticated: true,
        isLoading: false 
      })
    } catch (error) {
      const errorMessage = error instanceof ApiErrorResponse
        ? error.data.message
        : 'Login failed'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  register: async (registerData: RegisterData) => {
    set({ isLoading: true, error: null })
    try {
      const authResponse = await authService.register(registerData)
      // User info is already in register response, no need to call getCurrentUser
      set({ 
        authUser: authResponse, 
        user: authResponse.user as User,
        isAuthenticated: true,
        isLoading: false 
      })
    } catch (error) {
      const errorMessage = error instanceof ApiErrorResponse
        ? error.data.message
        : 'Registration failed'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  logout: () => {
    authService.logout()
    set({ authUser: null, user: null, isAuthenticated: false, error: null })
  },

  checkAuth: async () => {
    // Don't check if already authenticated
    const state = useAuthStore.getState()
    if (state.isAuthenticated && state.user) {
      return
    }
    
    // Check if cookies exist before making API call
    const hasToken = document.cookie.includes('access_token') || document.cookie.includes('refresh_token')
    if (!hasToken) {
      // No cookies, user is not logged in
      set({ authUser: null, user: null, isAuthenticated: false, isLoading: false })
      return
    }
    
    set({ isLoading: true })
    try {
      const userDetails = await authService.getCurrentUser()
      set({ user: userDetails.user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      // Silently fail - user is not logged in
      set({ authUser: null, user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
