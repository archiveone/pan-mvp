import { supabase } from '@/lib/supabase'
import { Profile } from '@/lib/supabase'

export interface ProfileUpdateData {
  name?: string
  handle?: string
  username?: string
  bio?: string
  avatar_url?: string
  website?: string
  user_location?: string
  is_business?: boolean
  business_type?: string
  profile_type?: string
  is_verified?: boolean
  verification_status?: string
  verification_level?: string
  bio_safety_checked?: boolean
  bio_is_safety_approved?: boolean
  bio_safety_score?: number
  hub_theme?: string
  hub_layout?: string
  hub_banner_url?: string
  hub_description?: string
  custom_css?: string
  show_stats?: boolean
  show_followers?: boolean
  show_posts?: boolean
  stripe_customer_id?: string
}

export class ProfileService {
  /**
   * Get a user's profile by ID
   */
  static async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Update a user's profile
   */
  static async updateProfile(userId: string, profileData: ProfileUpdateData): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Create a new profile
   */
  static async createProfile(userId: string, profileData: ProfileUpdateData): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Upload avatar image
   */
  static async uploadAvatar(userId: string, file: File): Promise<{ data: string | null; error: any }> {
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        return { data: null, error: uploadError }
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return { data: data.publicUrl, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Upload hub banner image
   */
  static async uploadHubBanner(userId: string, file: File): Promise<{ data: string | null; error: any }> {
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-banner-${Date.now()}.${fileExt}`
      const filePath = `hub-banners/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('hub-banners')
        .upload(filePath, file)

      if (uploadError) {
        return { data: null, error: uploadError }
      }

      // Get public URL
      const { data } = supabase.storage
        .from('hub-banners')
        .getPublicUrl(filePath)

      return { data: data.publicUrl, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get profiles by handle (for public profiles)
   */
  static async getProfileByHandle(handle: string): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', handle)
        .maybeSingle()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Search profiles
   */
  static async searchProfiles(query: string, limit: number = 10): Promise<{ data: Profile[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${query}%,handle.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(limit)

      return { data: data || [], error }
    } catch (error) {
      return { data: [], error }
    }
  }

  /**
   * Get business profiles
   */
  static async getBusinessProfiles(limit: number = 20): Promise<{ data: Profile[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_business', true)
        .eq('bio_is_safety_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      return { data: data || [], error }
    } catch (error) {
      return { data: [], error }
    }
  }

  /**
   * Get verified profiles
   */
  static async getVerifiedProfiles(limit: number = 20): Promise<{ data: Profile[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      return { data: data || [], error }
    } catch (error) {
      return { data: [], error }
    }
  }

  /**
   * Update verification status
   */
  static async updateVerificationStatus(
    userId: string, 
    status: 'unverified' | 'pending' | 'verified' | 'rejected',
    level: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          verification_status: status,
          verification_level: level,
          is_verified: status === 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Update safety status
   */
  static async updateSafetyStatus(
    userId: string,
    safetyData: {
      bio_safety_checked: boolean
      bio_is_safety_approved: boolean
      bio_safety_score: number
      bio_safety_violations?: string[]
    }
  ): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...safetyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Update hub customization
   */
  static async updateHubCustomization(
    userId: string,
    hubData: {
      hub_theme?: string
      hub_layout?: string
      hub_banner_url?: string
      hub_description?: string
      custom_css?: string
    }
  ): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...hubData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Update privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    privacyData: {
      show_stats?: boolean
      show_followers?: boolean
      show_posts?: boolean
    }
  ): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...privacyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}

