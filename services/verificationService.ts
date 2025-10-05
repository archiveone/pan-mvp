// Account Verification Service
// Handles identity verification, business verification, and age verification

import { supabase } from '@/lib/supabase'

export interface VerificationRequest {
  id: string
  user_id: string
  verification_type: 'identity' | 'business' | 'phone' | 'email'
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  documents?: any
  rejection_reason?: string
  verified_by?: string
  expires_at?: string
  created_at: string
}

export interface IdentityDocument {
  type: 'passport' | 'drivers_license' | 'national_id'
  front_image: string
  back_image?: string
  full_name: string
  date_of_birth: string
  document_number: string
  expiry_date?: string
}

export interface BusinessDocument {
  type: 'business_license' | 'tax_certificate' | 'registration'
  document_image: string
  business_name: string
  business_number: string
  address: string
  contact_person: string
}

class VerificationService {
  // Create identity verification request
  async createIdentityVerification(
    userId: string,
    document: IdentityDocument
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: userId,
          verification_type: 'identity',
          status: 'pending',
          documents: document,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, requestId: data.id }
    } catch (error) {
      console.error('Error creating identity verification:', error)
      return { success: false, error: error.message }
    }
  }

  // Create business verification request
  async createBusinessVerification(
    userId: string,
    document: BusinessDocument
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: userId,
          verification_type: 'business',
          status: 'pending',
          documents: document,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, requestId: data.id }
    } catch (error) {
      console.error('Error creating business verification:', error)
      return { success: false, error: error.message }
    }
  }

  // Create phone verification request
  async createPhoneVerification(
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: userId,
          verification_type: 'phone',
          status: 'pending',
          documents: { phone_number: phoneNumber },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, requestId: data.id }
    } catch (error) {
      console.error('Error creating phone verification:', error)
      return { success: false, error: error.message }
    }
  }

  // Create email verification request
  async createEmailVerification(
    userId: string,
    email: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: userId,
          verification_type: 'email',
          status: 'pending',
          documents: { email: email },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, requestId: data.id }
    } catch (error) {
      console.error('Error creating email verification:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user's verification status
  async getUserVerificationStatus(userId: string): Promise<{
    identity: boolean
    business: boolean
    phone: boolean
    email: boolean
    age: boolean
  }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_verified, age_verified, phone_verified, email_verified')
        .eq('id', userId)
        .single()

      if (error) throw error

      return {
        identity: data.is_verified || false,
        business: data.is_verified || false, // Business verification uses same flag
        phone: data.phone_verified || false,
        email: data.email_verified || false,
        age: data.age_verified || false
      }
    } catch (error) {
      console.error('Error getting verification status:', error)
      return {
        identity: false,
        business: false,
        phone: false,
        email: false,
        age: false
      }
    }
  }

  // Get pending verification requests
  async getPendingVerifications(): Promise<VerificationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profiles!verification_requests_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting pending verifications:', error)
      return []
    }
  }

  // Approve verification request
  async approveVerification(
    requestId: string,
    approvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the verification request
      const { data: request, error: fetchError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError) throw fetchError

      // Update verification request
      const { error: updateError } = await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          verified_by: approvedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Update user profile based on verification type
      const profileUpdates: any = {}
      
      switch (request.verification_type) {
        case 'identity':
          profileUpdates.is_verified = true
          profileUpdates.age_verified = true
          break
        case 'business':
          profileUpdates.is_verified = true
          profileUpdates.is_business = true
          break
        case 'phone':
          profileUpdates.phone_verified = true
          break
        case 'email':
          profileUpdates.email_verified = true
          break
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', request.user_id)

        if (profileError) throw profileError
      }

      return { success: true }
    } catch (error) {
      console.error('Error approving verification:', error)
      return { success: false, error: error.message }
    }
  }

  // Reject verification request
  async rejectVerification(
    requestId: string,
    rejectedBy: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          verified_by: rejectedBy,
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error rejecting verification:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if user needs age verification for content
  async requiresAgeVerification(userId: string, contentRating: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('age_verified')
        .eq('id', userId)
        .single()

      const isAgeVerified = data?.age_verified || false
      
      // Require age verification for R, NC-17, 18+ content
      const requiresVerification = ['R', 'NC-17', '18+'].includes(contentRating)
      
      return requiresVerification && !isAgeVerified
    } catch (error) {
      console.error('Error checking age verification:', error)
      return true // Default to requiring verification
    }
  }

  // Get verification requirements for content type
  getVerificationRequirements(contentType: string): {
    identity: boolean
    business: boolean
    age: boolean
  } {
    const requirements = {
      identity: false,
      business: false,
      age: false
    }

    switch (contentType) {
      case 'marketplace_item':
        requirements.identity = true
        break
      case 'music_album':
      case 'video_content':
      case 'movie':
        requirements.identity = true
        requirements.age = true
        break
      case 'event':
      case 'gig':
        requirements.identity = true
        break
      case 'service':
        requirements.identity = true
        requirements.business = true
        break
    }

    return requirements
  }
}

export const verificationService = new VerificationService()
