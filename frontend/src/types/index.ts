// API Error Response
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  detail?: string
}

// Auth Response Types
export interface AuthResponse {
  message: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  access_token: string
  refresh_token: string
}

export interface LogoutResponse {
  message: string
}

export interface RegisterResponse {
  message: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  access_token: string
  refresh_token: string
}

export interface RefreshTokenResponse {
  message: string
  access_token: string
  refresh_token: string
}

export interface MeResponse {
  message: string
  user: User
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  check_password: string
  first_name: string
  last_name: string

}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  profile?: UserProfile
  created_at: string
  updated_at: string
  is_active: boolean
  is_verified: boolean
  is_admin: boolean
  is_superuser: boolean
  is_deleted: boolean
  is_blocked: boolean
  is_banned: boolean
  is_suspended: boolean
}

export enum UserRole {
  ANONYMOUS = 'anonymous',
  REGISTERED = 'registered',
  ADMIN = 'admin',
}

export interface UserProfile {
  id: string
  user_id: string
  bio?: string
  profile_picture?: string
  location?: string
  skills: string[]
  time_credits: number
  rating?: number
  phone_number?: string
}




// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}
