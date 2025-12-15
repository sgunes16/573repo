export const activity_type = [
  '1to1',
  'group',
]
export const offer_type = [
  '1time',
  'recurring',
]
export const location_type = [
  'myLocation',
  'remote',
]
export const status = [
  'ACTIVE',
  'PENDING',
  'COMPLETED',
  'CANCELLED',
]

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
  username?: string
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
  warning_count?: number
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
  avatar?: string
  geo_location?: string
  location?: string
  skills: string[]
  time_credits: number
  rating?: number
  phone_number?: string
  badges?: string[]
  is_onboarded?: boolean
}

export interface UserProfileResponse {
  message: string
  user_profile: UserProfile
  timebank: TimeBank
}

// Offer & Want types
export interface Offer {
  id: string
  user_id: string
  user: User
  type: 'offer' | 'want'
  title: string
  description: string
  time_required: number 
  location?: string
  geo_location?: number[]
  tags: string[]
  images?: OfferImage[]
  activity_type: string
  offer_type: string
  person_count: number
  location_type: string
  // Timezone-aware datetime (ISO 8601 format)
  scheduled_at?: string
  from_date?: string
  to_date?: string
  status: OfferStatus
  created_at: string
  updated_at: string
  can_edit?: boolean
  // Group offer slot information
  filled_slots?: number
  total_slots?: number
  slots_available?: boolean
  active_slots?: number
  completed_slots?: number
  provider_paid?: boolean
  // Flagged by admin
  is_flagged?: boolean
  flagged_reason?: string
}

export interface CreateOfferResponse {
  message: string
  offer_id: string
}

export interface OfferImage {
  id: number
  url: string
  caption: string
  is_primary: boolean
}

export interface UploadImageResponse {
  message: string
  images: OfferImage[]
}

export interface Want {
  id: string
  user_id: string
  user: User
  title: string
  description: string
  category: string
  time_offered: number 
  location?: string
  tags: string[]
  status: WantStatus
  created_at: string
  updated_at: string
}

export enum OfferStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WantStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

// Exchange types
export interface Exchange {
  id: string
  offer: {
    id: string
    title: string
    description: string
    time_required: number
    type: 'offer' | 'want'
    location?: string
    geo_location?: number[]
    // Timezone-aware datetime (ISO 8601 format)
    scheduled_at?: string
    activity_type?: string
    person_count?: number
    location_type?: string
    tags?: string[]
  }
  provider: User
  requester: User
  status: ExchangeStatus
  time_spent: number
  // Timezone-aware datetime (ISO 8601 format)
  proposed_at?: string
  requester_confirmed: boolean
  provider_confirmed: boolean
  created_at: string
  completed_at?: string
  ratings?: ExchangeRating[]
}

export enum ExchangeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export interface ExchangeRating {
  id?: string
  rater_id?: string
  ratee_id?: string
  rater?: {
    id: string
    first_name: string
    last_name: string
    profile?: {
      avatar?: string
    }
  }
  exchange?: {
    id: string
    offer: {
      id: string
      title: string
    }
  }
  communication: number  // 1-5
  punctuality: number    // 1-5
  would_recommend: boolean
  comment?: string
  created_at?: string
}

// TimeBank types
export interface TimeBankTransaction {
  id: string
  from_user: User
  to_user: User
  exchange?: {
    id: string
    offer: {
      id: string
      title: string
    }
  }
  time_amount: number
  transaction_type: TransactionType
  description: string
  created_at: string
  ratings?: ExchangeRating[]
  comments?: Comment[]
}

export enum TransactionType {
  EARN = 'EARN',
  SPEND = 'SPEND',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

// Chat & Message types
export interface Chat {
  id: string
  participants: User[]
  last_message?: Message
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  sender: User
  content: string
  is_read: boolean
  created_at: string
}

// Comment type (from ExchangeRating)
export interface RatingComment {
  id: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile?: {
      avatar?: string
    }
  }
  content: string
  rating: number
  exchange?: {
    id: string
    offer_title?: string
  }
  created_at: string
}

export interface TimeBank {
  id: string
  user_id: string
  user: User
  amount: number
  blocked_amount: number
  available_amount: number
  total_amount: number
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

// Report types
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'FAKE_PROFILE' | 'HARASSMENT' | 'FRAUD' | 'OTHER'
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
export type ReportTargetType = 'offer' | 'want' | 'exchange' | 'user'

export interface Report {
  id: string
  reporter: User
  reported_user?: User
  target_type: ReportTargetType
  target_id: number
  target_info?: {
    id: number
    title?: string
    type?: string
    email?: string
    first_name?: string
    last_name?: string
    deleted?: boolean
  }
  reason: ReportReason
  description: string
  status: ReportStatus
  admin_notes?: string
  resolved_by?: User
  created_at: string
  updated_at: string
}

export interface CreateReportData {
  target_type: ReportTargetType
  target_id: number
  reason: ReportReason
  description?: string
}
