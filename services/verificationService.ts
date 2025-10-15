import { supabase } from '@/lib/supabase';

export interface VerificationRequest {
  verificationType: 'individual' | 'business' | 'creator' | 'enterprise';
  fullName?: string;
  dateOfBirth?: string;
  governmentIdType?: string;
  governmentIdNumber?: string;
  businessName?: string;
  businessRegistrationNumber?: string;
  businessType?: string;
  businessWebsite?: string;
  taxId?: string;
  phoneNumber?: string;
}

export interface VerificationBadge {
  badgeType: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  badgeColor: string;
  earnedAt: Date;
}

class VerificationService {
  // Submit verification request
  async submitVerificationRequest(
    userId: string,
    data: VerificationRequest,
    documents: {
      idDocument?: File;
      businessLicense?: File;
      proofOfAddress?: File;
    }
  ) {
    try {
      // Upload documents to storage
      const uploadedDocs: any = {};

      if (documents.idDocument) {
        const { data: idDoc, error: idError } = await supabase.storage
          .from('verification-documents')
          .upload(`${userId}/id-${Date.now()}.pdf`, documents.idDocument);
        
        if (idError) throw idError;
        uploadedDocs.id_document_url = idDoc.path;
      }

      if (documents.businessLicense) {
        const { data: bizDoc, error: bizError } = await supabase.storage
          .from('verification-documents')
          .upload(`${userId}/business-${Date.now()}.pdf`, documents.businessLicense);
        
        if (bizError) throw bizError;
        uploadedDocs.business_license_url = bizDoc.path;
      }

      if (documents.proofOfAddress) {
        const { data: addressDoc, error: addressError } = await supabase.storage
          .from('verification-documents')
          .upload(`${userId}/address-${Date.now()}.pdf`, documents.proofOfAddress);
        
        if (addressError) throw addressError;
        uploadedDocs.proof_of_address_url = addressDoc.path;
      }

      // Create verification request
      const { data, error } = await supabase
        .from('profile_verifications')
        .upsert({
          user_id: userId,
          verification_type: data.verificationType,
          verification_status: 'pending',
          full_name: data.fullName,
          date_of_birth: data.dateOfBirth,
          government_id_type: data.governmentIdType,
          government_id_number: data.governmentIdNumber,
          business_name: data.businessName,
          business_registration_number: data.businessRegistrationNumber,
          business_type: data.businessType,
          business_website: data.businessWebsite,
          tax_id: data.taxId,
          phone_number: data.phoneNumber,
          submitted_at: new Date().toISOString(),
          ...uploadedDocs
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for user
      await this.createNotification(
        userId,
        'verification_submitted',
        'Verification Request Submitted',
        'Your verification request has been submitted and is under review. We\'ll notify you once it\'s processed.',
        '/settings/verification'
      );

      return { success: true, data };
    } catch (error) {
      console.error('Error submitting verification:', error);
      return { success: false, error };
    }
  }

  // Get user's verification status
  async getVerificationStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profile_verifications')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return { success: false, error };
    }
  }

  // Get user's badges
  async getUserBadges(userId: string): Promise<VerificationBadge[]> {
    try {
      const { data, error } = await supabase
        .from('verification_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting badges:', error);
      return [];
    }
  }

  // Award badge to user
  async awardBadge(
    userId: string,
    badgeType: string,
    badgeName: string,
    description: string,
    icon: string = '✓',
    color: string = 'blue'
  ) {
    try {
      const { data, error } = await supabase
        .from('verification_badges')
        .insert({
          user_id: userId,
          badge_type: badgeType,
          badge_name: badgeName,
          badge_description: description,
          badge_icon: icon,
          badge_color: color
        })
        .select()
        .single();

      if (error) throw error;

      // Notify user of new badge
      await this.createNotification(
        userId,
        'achievement',
        `New Badge Earned: ${badgeName}`,
        description,
        '/profile',
        'high'
      );

      return { success: true, data };
    } catch (error: any) {
      // Ignore duplicate badge errors
      if (error?.code === '23505') {
        return { success: true, data: null };
      }
      console.error('Error awarding badge:', error);
      return { success: false, error };
    }
  }

  // Verify email
  async verifyEmail(userId: string) {
    try {
      const { error } = await supabase
        .from('profile_verifications')
        .upsert({
          user_id: userId,
          email_verified: true
        });

      if (error) throw error;

      // Award email verification badge
      await this.awardBadge(
        userId,
        'verified',
        'Email Verified',
        'Verified email address',
        '✉️',
        'green'
      );

      return { success: true };
    } catch (error) {
      console.error('Error verifying email:', error);
      return { success: false, error };
    }
  }

  // Verify phone
  async verifyPhone(userId: string, phoneNumber: string) {
    try {
      const { error } = await supabase
        .from('profile_verifications')
        .upsert({
          user_id: userId,
          phone_verified: true,
          phone_number: phoneNumber
        });

      if (error) throw error;

      // Award phone verification badge
      await this.awardBadge(
        userId,
        'verified',
        'Phone Verified',
        'Verified phone number',
        '📱',
        'green'
      );

      return { success: true };
    } catch (error) {
      console.error('Error verifying phone:', error);
      return { success: false, error };
    }
  }

  // Check if user is verified
  async isUserVerified(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('profile_verifications')
        .select('verification_status, verification_level')
        .eq('user_id', userId)
        .single();

      return data?.verification_status === 'verified' && 
             data?.verification_level !== 'none';
    } catch (error) {
      return false;
    }
  }

  // Get verification badge icon for display
  getVerificationIcon(verificationLevel: string): string {
    const icons: { [key: string]: string } = {
      email: '✉️',
      phone: '📱',
      identity: '🆔',
      business: '🏢',
      premium: '⭐'
    };
    return icons[verificationLevel] || '✓';
  }

  // Helper to create notification
  private async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    actionUrl?: string,
    priority: string = 'normal'
  ) {
    try {
      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_action_url: actionUrl,
        p_priority: priority
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Admin: Approve verification
  async approveVerification(
    userId: string,
    reviewerId: string,
    verificationLevel: 'email' | 'phone' | 'identity' | 'business' | 'premium'
  ) {
    try {
      const { error } = await supabase
        .from('profile_verifications')
        .update({
          verification_status: 'verified',
          verification_level: verificationLevel,
          verified_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Award verified badge
      const badgeNames: { [key: string]: string } = {
        email: 'Email Verified',
        phone: 'Phone Verified',
        identity: 'Identity Verified',
        business: 'Business Verified',
        premium: 'Premium Verified'
      };

      await this.awardBadge(
        userId,
        verificationLevel === 'business' ? 'business_verified' : 'verified',
        badgeNames[verificationLevel],
        `Successfully verified as ${verificationLevel}`,
        this.getVerificationIcon(verificationLevel),
        verificationLevel === 'premium' ? 'gold' : 'blue'
      );

      // Notify user
      await this.createNotification(
        userId,
        'verification_approved',
        'Verification Approved! ✓',
        `Congratulations! Your ${verificationLevel} verification has been approved.`,
        '/profile',
        'high'
      );

      return { success: true };
    } catch (error) {
      console.error('Error approving verification:', error);
      return { success: false, error };
    }
  }

  // Admin: Reject verification
  async rejectVerification(
    userId: string,
    reviewerId: string,
    reason: string
  ) {
    try {
      const { error } = await supabase
        .from('profile_verifications')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Notify user
      await this.createNotification(
        userId,
        'warning',
        'Verification Request Update',
        `Your verification request was not approved. Reason: ${reason}`,
        '/settings/verification',
        'high'
      );

      return { success: true };
    } catch (error) {
      console.error('Error rejecting verification:', error);
      return { success: false, error };
    }
  }
}

export const verificationService = new VerificationService();
