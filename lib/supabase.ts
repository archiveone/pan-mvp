import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'))
}

// Create a safe client that handles missing credentials
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit', // Use implicit flow for better compatibility
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      },
      global: {
        headers: {
          'x-application-name': 'pan-marketplace'
        },
        // Add fetch options for better timeout handling
        fetch: (url, options = {}) => {
          // Shorter timeout in development for faster feedback
          const timeout = process.env.NODE_ENV === 'development' ? 5000 : 30000;
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(timeout)
          }).catch(error => {
            if (error.name === 'TimeoutError' || error.name === 'AbortError') {
              console.warn('⏱️ Supabase request timed out - might need to set up database tables');
            } else {
              console.error('Supabase request failed:', error);
            }
            throw error;
          });
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null as any // Return null if not configured (will be handled by services)

// Connection health check
export const checkConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false; // No connection in demo mode
  }
  
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Database types - comprehensive profile schema
export interface Profile {
  id: string
  name?: string
  handle?: string
  avatar_url?: string
  bio?: string
  verification_status?: string
  created_at: string
  username?: string
  website?: string
  user_location?: string
  is_verified?: boolean
  is_business?: boolean
  business_type?: string
  bio_safety_score?: number
  bio_safety_checked?: boolean
  bio_safety_violations?: string[]
  bio_is_safety_approved?: boolean
  profile_type?: string
  hub_theme?: string
  hub_layout?: string
  show_stats?: boolean
  show_followers?: boolean
  show_posts?: boolean
  custom_css?: string
  hub_banner_url?: string
  hub_description?: string
  verification_level?: string
  verification_data?: any
  stripe_customer_id?: string
}

export interface Post {
  id: string
  title: string
  content?: string
  location?: string
  user_id: string
  created_at: string
}

// For the marketplace, we'll use posts as listings
export interface Listing {
  id: string
  title: string
  content?: string // description
  price?: string // we'll add this to content or create a new field
  location?: string
  category?: string // we'll derive this from content or add a field
  image_url?: string // we'll add this field
  user_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at'>
        Update: Partial<Omit<Post, 'id' | 'created_at'>>
      }
      comments: {
        Row: any
        Insert: any
        Update: any
      }
      notifications: {
        Row: any
        Insert: any
        Update: any
      }
      saves: {
        Row: any
        Insert: any
        Update: any
      }
    }
  }
}
