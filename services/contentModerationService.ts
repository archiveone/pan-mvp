// Content Moderation Service
// Handles automated content detection and moderation

import { supabase } from '@/lib/supabase'

export interface ModerationResult {
  isApproved: boolean
  confidence: number
  flags: string[]
  reason?: string
}

export interface ContentAnalysis {
  hasNudity: boolean
  hasViolence: boolean
  hasWeapons: boolean
  hasDrugs: boolean
  hasHateSpeech: boolean
  isSpam: boolean
  confidence: number
}

class ContentModerationService {
  // Banned keywords for text content
  private bannedKeywords = {
    weapons: ['gun', 'weapon', 'knife', 'ammo', 'ammunition', 'rifle', 'pistol', 'bomb', 'explosive'],
    drugs: ['cocaine', 'heroin', 'marijuana', 'cannabis', 'weed', 'drugs', 'pills', 'crystal', 'meth'],
    explicit: ['porn', 'pornography', 'nude', 'naked', 'sex', 'xxx', 'adult'],
    violence: ['kill', 'murder', 'suicide', 'bomb', 'terrorist', 'attack', 'violence'],
    hateSpeech: ['hate', 'racist', 'nazi', 'fascist', 'discrimination']
  }

  // Analyze text content for violations
  async analyzeTextContent(text: string): Promise<ContentAnalysis> {
    const lowerText = text.toLowerCase()
    
    const analysis: ContentAnalysis = {
      hasNudity: false,
      hasViolence: false,
      hasWeapons: false,
      hasDrugs: false,
      hasHateSpeech: false,
      isSpam: false,
      confidence: 0
    }

    let violationCount = 0
    const totalCategories = 6

    // Check for weapons
    if (this.bannedKeywords.weapons.some(keyword => lowerText.includes(keyword))) {
      analysis.hasWeapons = true
      violationCount++
    }

    // Check for drugs
    if (this.bannedKeywords.drugs.some(keyword => lowerText.includes(keyword))) {
      analysis.hasDrugs = true
      violationCount++
    }

    // Check for explicit content
    if (this.bannedKeywords.explicit.some(keyword => lowerText.includes(keyword))) {
      analysis.hasNudity = true
      violationCount++
    }

    // Check for violence
    if (this.bannedKeywords.violence.some(keyword => lowerText.includes(keyword))) {
      analysis.hasViolence = true
      violationCount++
    }

    // Check for hate speech
    if (this.bannedKeywords.hateSpeech.some(keyword => lowerText.includes(keyword))) {
      analysis.hasHateSpeech = true
      violationCount++
    }

    // Check for spam patterns
    if (this.detectSpam(text)) {
      analysis.isSpam = true
      violationCount++
    }

    // Calculate confidence based on violations
    analysis.confidence = (violationCount / totalCategories) * 100

    return analysis
  }

  // Detect spam patterns
  private detectSpam(text: string): boolean {
    // Check for excessive repetition
    const words = text.split(' ')
    const uniqueWords = new Set(words)
    const repetitionRatio = uniqueWords.size / words.length

    // Check for excessive caps
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length

    // Check for excessive special characters
    const specialCharRatio = (text.match(/[!@#$%^&*()_+={}[\]|\\:";'<>?,./]/g) || []).length / text.length

    // Check for repeated characters
    const hasRepeatedChars = /(.)\1{4,}/.test(text)

    return repetitionRatio < 0.3 || capsRatio > 0.5 || specialCharRatio > 0.3 || hasRepeatedChars
  }

  // Moderate a post
  async moderatePost(postId: string, content: string, title: string): Promise<ModerationResult> {
    try {
      // Analyze text content
      const analysis = await this.analyzeTextContent(`${title} ${content}`)
      
      const flags: string[] = []
      let isApproved = true
      let reason = ''

      // Check for violations
      if (analysis.hasWeapons) {
        flags.push('weapons')
        isApproved = false
        reason = 'Content contains weapon-related keywords'
      }

      if (analysis.hasDrugs) {
        flags.push('drugs')
        isApproved = false
        reason = 'Content contains drug-related keywords'
      }

      if (analysis.hasNudity) {
        flags.push('explicit')
        isApproved = false
        reason = 'Content contains explicit material'
      }

      if (analysis.hasViolence) {
        flags.push('violence')
        isApproved = false
        reason = 'Content contains violent content'
      }

      if (analysis.hasHateSpeech) {
        flags.push('hate_speech')
        isApproved = false
        reason = 'Content contains hate speech'
      }

      if (analysis.isSpam) {
        flags.push('spam')
        isApproved = false
        reason = 'Content appears to be spam'
      }

      // If content is flagged, add to moderation queue
      if (!isApproved) {
        await this.addToModerationQueue(postId, flags, analysis.confidence)
      }

      return {
        isApproved,
        confidence: analysis.confidence,
        flags,
        reason
      }
    } catch (error) {
      console.error('Error moderating content:', error)
      return {
        isApproved: true, // Default to approved on error
        confidence: 0,
        flags: [],
        reason: 'Moderation error'
      }
    }
  }

  // Add content to moderation queue
  private async addToModerationQueue(postId: string, flags: string[], confidence: number) {
    try {
      const priority = confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low'
      
      await supabase
        .from('moderation_queue')
        .insert({
          post_id: postId,
          priority,
          auto_flagged: true,
          manual_review: true,
          status: 'pending'
        })
    } catch (error) {
      console.error('Error adding to moderation queue:', error)
    }
  }

  // Report content
  async reportContent(
    reportedBy: string,
    postId: string | null,
    commentId: string | null,
    reportType: string,
    description: string
  ) {
    try {
      await supabase
        .from('moderation_reports')
        .insert({
          reported_by: reportedBy,
          post_id: postId,
          comment_id: commentId,
          report_type: reportType,
          description,
          status: 'pending'
        })
    } catch (error) {
      console.error('Error creating report:', error)
    }
  }

  // Get user trust score
  async getUserTrustScore(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_trust_scores')
        .select('trust_score')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data?.trust_score || 100
    } catch (error) {
      console.error('Error getting trust score:', error)
      return 100 // Default to high trust
    }
  }

  // Update user trust score
  async updateTrustScore(userId: string, violation: boolean) {
    try {
      const currentScore = await this.getUserTrustScore(userId)
      const newScore = violation ? Math.max(0, currentScore - 10) : Math.min(100, currentScore + 1)
      
      await supabase
        .from('user_trust_scores')
        .upsert({
          user_id: userId,
          trust_score: newScore,
          violations_count: violation ? 1 : 0,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating trust score:', error)
    }
  }

  // Check if user can post content
  async canUserPost(userId: string): Promise<boolean> {
    try {
      const trustScore = await this.getUserTrustScore(userId)
      
      // Check if user is suspended
      const { data: userActions } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('action_type', ['suspension', 'ban'])

      return trustScore > 20 && !userActions?.length
    } catch (error) {
      console.error('Error checking user permissions:', error)
      return true // Default to allowing posts
    }
  }
}

export const contentModerationService = new ContentModerationService()
