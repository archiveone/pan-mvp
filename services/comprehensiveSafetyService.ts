// Comprehensive Safety Service for All User-Generated Content
// Covers posts, comments, bios, profiles, messages, and all text content

import { supabase } from '@/lib/supabase'

export interface SafetyResult {
  isSafe: boolean
  safetyScore: number
  violations: string[]
  requiresReview: boolean
  action: 'approve' | 'flag' | 'block' | 'require_verification'
  reason?: string
}

export interface ContentSafetyCheck {
  contentId: string
  contentType: 'post' | 'comment' | 'profile_bio' | 'message' | 'community_description'
  contentText: string
  safetyScore: number
  violations: string[]
  isApproved: boolean
  isFlagged: boolean
  requiresReview: boolean
}

class ComprehensiveSafetyService {
  private bannedKeywords: Map<string, { category: string; severity: string; context: string }> = new Map()

  constructor() {
    this.loadBannedKeywords()
  }

  // Load banned keywords from database
  private async loadBannedKeywords() {
    try {
      const { data, error } = await supabase
        .from('safety_keywords')
        .select('keyword, category, severity, context')
        .eq('is_active', true)

      if (error) throw error

      data?.forEach(keyword => {
        this.bannedKeywords.set(keyword.keyword.toLowerCase(), {
          category: keyword.category,
          severity: keyword.severity,
          context: keyword.context
        })
      })
    } catch (error) {
      console.error('Error loading banned keywords:', error)
    }
  }

  // Check text content for safety violations
  async checkContentSafety(
    contentText: string,
    contentType: 'post' | 'comment' | 'profile_bio' | 'message' | 'community_description',
    contentId?: string
  ): Promise<SafetyResult> {
    try {
      const lowerText = contentText.toLowerCase()
      const violations: string[] = []
      let safetyScore = 0
      let maxSeverity = 'low'

      // Check against banned keywords
      for (const [keyword, data] of this.bannedKeywords) {
        if (lowerText.includes(keyword)) {
          // Check if keyword applies to this content type
          if (data.context === 'any' || data.context === contentType) {
            violations.push(data.category)
            
            // Calculate safety score based on severity
            const severityScore = this.getSeverityScore(data.severity)
            safetyScore = Math.max(safetyScore, severityScore)
            maxSeverity = this.getHigherSeverity(maxSeverity, data.severity)
          }
        }
      }

      // Check for additional patterns
      const patternViolations = this.checkPatterns(contentText, contentType)
      violations.push(...patternViolations.violations)
      safetyScore = Math.max(safetyScore, patternViolations.score)

      // Determine action based on safety score and violations
      const action = this.determineAction(safetyScore, violations, contentType)
      const isSafe = action === 'approve'
      const requiresReview = action === 'flag' || action === 'require_verification'

      // Store safety check if contentId provided
      if (contentId) {
        await this.storeSafetyCheck(contentId, contentType, contentText, safetyScore, violations, isSafe, requiresReview)
      }

      return {
        isSafe,
        safetyScore,
        violations: [...new Set(violations)], // Remove duplicates
        requiresReview,
        action,
        reason: this.getReason(violations, maxSeverity)
      }
    } catch (error) {
      console.error('Error checking content safety:', error)
      return {
        isSafe: true, // Default to safe on error
        safetyScore: 0,
        violations: [],
        requiresReview: false,
        action: 'approve'
      }
    }
  }

  // Check for additional patterns beyond keywords
  private checkPatterns(text: string, contentType: string): { violations: string[]; score: number } {
    const violations: string[] = []
    let score = 0

    // Check for excessive caps (spam indicator)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
    if (capsRatio > 0.7) {
      violations.push('spam')
      score = Math.max(score, 30)
    }

    // Check for excessive special characters
    const specialCharRatio = (text.match(/[!@#$%^&*()_+={}[\]|\\:";'<>?,./]/g) || []).length / text.length
    if (specialCharRatio > 0.3) {
      violations.push('spam')
      score = Math.max(score, 40)
    }

    // Check for repeated characters
    if (/(.)\1{4,}/.test(text)) {
      violations.push('spam')
      score = Math.max(score, 50)
    }

    // Check for phone numbers (potential spam)
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) {
      violations.push('spam')
      score = Math.max(score, 20)
    }

    // Check for email addresses (potential spam)
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
      violations.push('spam')
      score = Math.max(score, 20)
    }

    // Check for URLs (potential spam)
    if (/(https?:\/\/[^\s]+)/.test(text)) {
      violations.push('spam')
      score = Math.max(score, 30)
    }

    return { violations, score }
  }

  // Get severity score
  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'low': return 20
      case 'medium': return 50
      case 'high': return 80
      case 'critical': return 100
      default: return 0
    }
  }

  // Get higher severity
  private getHigherSeverity(severity1: string, severity2: string): string {
    const severities = ['low', 'medium', 'high', 'critical']
    const index1 = severities.indexOf(severity1)
    const index2 = severities.indexOf(severity2)
    return index1 > index2 ? severity1 : severity2
  }

  // Determine action based on safety score and violations
  private determineAction(score: number, violations: string[], contentType: string): 'approve' | 'flag' | 'block' | 'require_verification' {
    // Critical violations - always block
    if (violations.includes('pedophilia') || violations.includes('hate_speech') || score >= 90) {
      return 'block'
    }

    // High violations - block or flag based on content type
    if (score >= 70) {
      return contentType === 'message' ? 'block' : 'flag'
    }

    // Medium violations - flag for review
    if (score >= 50) {
      return 'flag'
    }

    // Low violations - require verification for sensitive content
    if (score >= 30 && (contentType === 'post' || contentType === 'profile_bio')) {
      return 'require_verification'
    }

    return 'approve'
  }

  // Get reason for action
  private getReason(violations: string[], maxSeverity: string): string {
    if (violations.includes('pedophilia')) {
      return 'Content contains child exploitation material'
    }
    if (violations.includes('hate_speech')) {
      return 'Content contains hate speech or discrimination'
    }
    if (violations.includes('nudity') || violations.includes('sexual')) {
      return 'Content contains explicit material'
    }
    if (violations.includes('weapons')) {
      return 'Content contains weapon-related material'
    }
    if (violations.includes('drugs')) {
      return 'Content contains drug-related material'
    }
    if (violations.includes('spam')) {
      return 'Content appears to be spam'
    }
    if (violations.includes('violence')) {
      return 'Content contains violent material'
    }
    return `Content flagged due to ${maxSeverity} severity violations`
  }

  // Store safety check in database
  private async storeSafetyCheck(
    contentId: string,
    contentType: string,
    contentText: string,
    safetyScore: number,
    violations: string[],
    isApproved: boolean,
    requiresReview: boolean
  ) {
    try {
      await supabase
        .from('content_safety_checks')
        .insert({
          content_id: contentId,
          content_type: contentType,
          content_text: contentText,
          safety_score: safetyScore,
          violations_detected: violations,
          is_approved: isApproved,
          is_flagged: requiresReview,
          auto_moderated: true,
          manual_review_required: requiresReview
        })
    } catch (error) {
      console.error('Error storing safety check:', error)
    }
  }

  // Check post safety
  async checkPostSafety(postId: string, title: string, content: string): Promise<SafetyResult> {
    return this.checkContentSafety(`${title} ${content}`, 'post', postId)
  }

  // Check comment safety
  async checkCommentSafety(commentId: string, content: string): Promise<SafetyResult> {
    return this.checkContentSafety(content, 'comment', commentId)
  }

  // Check profile bio safety
  async checkBioSafety(profileId: string, bio: string): Promise<SafetyResult> {
    return this.checkContentSafety(bio, 'profile_bio', profileId)
  }

  // Check message safety
  async checkMessageSafety(messageId: string, content: string): Promise<SafetyResult> {
    return this.checkContentSafety(content, 'message', messageId)
  }

  // Check community description safety
  async checkCommunityDescriptionSafety(communityId: string, description: string): Promise<SafetyResult> {
    return this.checkContentSafety(description, 'community_description', communityId)
  }

  // Update user trust score based on violations
  async updateUserTrustScore(userId: string, violations: string[], safetyScore: number) {
    try {
      const trustPenalty = this.calculateTrustPenalty(violations, safetyScore)
      
      const { data: currentScore } = await supabase
        .from('user_trust_scores')
        .select('trust_score, violations_count')
        .eq('user_id', userId)
        .single()

      const newTrustScore = Math.max(0, (currentScore?.trust_score || 100) - trustPenalty)
      const newViolationsCount = (currentScore?.violations_count || 0) + 1

      await supabase
        .from('user_trust_scores')
        .upsert({
          user_id: userId,
          trust_score: newTrustScore,
          violations_count: newViolationsCount,
          last_violation: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating trust score:', error)
    }
  }

  // Calculate trust penalty
  private calculateTrustPenalty(violations: string[], safetyScore: number): number {
    let penalty = 0

    // Base penalty from safety score
    penalty += Math.floor(safetyScore / 10)

    // Additional penalties for specific violations
    if (violations.includes('pedophilia')) penalty += 50
    if (violations.includes('hate_speech')) penalty += 30
    if (violations.includes('nudity') || violations.includes('sexual')) penalty += 20
    if (violations.includes('weapons')) penalty += 15
    if (violations.includes('drugs')) penalty += 15
    if (violations.includes('spam')) penalty += 5

    return Math.min(penalty, 100) // Cap at 100
  }

  // Get safety statistics
  async getSafetyStatistics(): Promise<{
    totalChecks: number
    flaggedContent: number
    blockedContent: number
    topViolations: { violation: string; count: number }[]
  }> {
    try {
      const { data: checks } = await supabase
        .from('content_safety_checks')
        .select('safety_score, violations_detected, is_flagged, is_approved')

      const totalChecks = checks?.length || 0
      const flaggedContent = checks?.filter(c => c.is_flagged).length || 0
      const blockedContent = checks?.filter(c => !c.is_approved).length || 0

      // Count violations
      const violationCounts: { [key: string]: number } = {}
      checks?.forEach(check => {
        check.violations_detected?.forEach((violation: string) => {
          violationCounts[violation] = (violationCounts[violation] || 0) + 1
        })
      })

      const topViolations = Object.entries(violationCounts)
        .map(([violation, count]) => ({ violation, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return {
        totalChecks,
        flaggedContent,
        blockedContent,
        topViolations
      }
    } catch (error) {
      console.error('Error getting safety statistics:', error)
      return {
        totalChecks: 0,
        flaggedContent: 0,
        blockedContent: 0,
        topViolations: []
      }
    }
  }

  // Refresh banned keywords from database
  async refreshBannedKeywords() {
    await this.loadBannedKeywords()
  }
}

export const comprehensiveSafetyService = new ComprehensiveSafetyService()
