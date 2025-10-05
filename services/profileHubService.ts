// Profile Hub Service
// Handles all profile types: gamers, professionals, artists, musicians, etc.

import { supabase } from '@/lib/supabase'

export interface ProfileHub {
  id: string
  username: string
  displayName: string
  bio: string
  profileType: 'personal' | 'business' | 'creator' | 'artist' | 'musician' | 'gamer' | 'professional'
  hubTheme: string
  hubLayout: 'grid' | 'list' | 'masonry' | 'timeline'
  avatarUrl?: string
  bannerUrl?: string
  hubDescription?: string
  showStats: boolean
  showFollowers: boolean
  showPosts: boolean
  customCss?: string
  stats: ProfileStats
  sections: ProfileSection[]
  links: ProfileLink[]
  highlights: ProfileHighlight[]
  collections: ProfileCollection[]
  achievements: ProfileAchievement[]
}

export interface ProfileStats {
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalFollowers: number
  totalFollowing: number
  totalSales: number
  totalEarnings: number
  engagementRate: number
  lastActive: string
}

export interface ProfileSection {
  id: string
  name: string
  type: 'gallery' | 'portfolio' | 'services' | 'products' | 'events' | 'music' | 'videos' | 'posts' | 'links'
  description?: string
  isPublic: boolean
  sortOrder: number
}

export interface ProfileLink {
  id: string
  linkType: string
  linkUrl: string
  linkText?: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProfileHighlight {
  id: string
  postId: string
  title?: string
  isPinned: boolean
  sortOrder: number
}

export interface ProfileCollection {
  id: string
  name: string
  description?: string
  isPublic: boolean
  postCount: number
}

export interface ProfileAchievement {
  id: string
  achievementType: string
  achievementName: string
  description?: string
  iconUrl?: string
  earnedAt: string
}

class ProfileHubService {
  // Get complete profile hub
  async getProfileHub(profileId: string): Promise<ProfileHub | null> {
    try {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (profileError) throw profileError

      // Get stats
      const stats = await this.getProfileStats(profileId)
      
      // Get sections
      const sections = await this.getProfileSections(profileId)
      
      // Get links
      const links = await this.getProfileLinks(profileId)
      
      // Get highlights
      const highlights = await this.getProfileHighlights(profileId)
      
      // Get collections
      const collections = await this.getProfileCollections(profileId)
      
      // Get achievements
      const achievements = await this.getProfileAchievements(profileId)

      return {
        id: profile.id,
        username: profile.username || '',
        displayName: profile.display_name || '',
        bio: profile.bio || '',
        profileType: profile.profile_type || 'personal',
        hubTheme: profile.hub_theme || 'default',
        hubLayout: profile.hub_layout || 'grid',
        avatarUrl: profile.avatar_url,
        bannerUrl: profile.hub_banner_url,
        hubDescription: profile.hub_description,
        showStats: profile.show_stats || true,
        showFollowers: profile.show_followers || true,
        showPosts: profile.show_posts || true,
        customCss: profile.custom_css,
        stats,
        sections,
        links,
        highlights,
        collections,
        achievements
      }
    } catch (error) {
      console.error('Error getting profile hub:', error)
      return null
    }
  }

  // Get profile stats
  async getProfileStats(profileId: string): Promise<ProfileStats> {
    try {
      const { data, error } = await supabase
        .from('profile_stats')
        .select('*')
        .eq('profile_id', profileId)
        .single()

      if (error) throw error

      return {
        totalPosts: data.total_posts || 0,
        totalViews: data.total_views || 0,
        totalLikes: data.total_likes || 0,
        totalFollowers: data.total_followers || 0,
        totalFollowing: data.total_following || 0,
        totalSales: data.total_sales || 0,
        totalEarnings: data.total_earnings || 0,
        engagementRate: data.engagement_rate || 0,
        lastActive: data.last_active || ''
      }
    } catch (error) {
      console.error('Error getting profile stats:', error)
      return {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        totalSales: 0,
        totalEarnings: 0,
        engagementRate: 0,
        lastActive: ''
      }
    }
  }

  // Get profile sections
  async getProfileSections(profileId: string): Promise<ProfileSection[]> {
    try {
      const { data, error } = await supabase
        .from('profile_sections')
        .select('*')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return data?.map(section => ({
        id: section.id,
        name: section.section_name,
        type: section.section_type,
        description: section.description,
        isPublic: section.is_public,
        sortOrder: section.sort_order
      })) || []
    } catch (error) {
      console.error('Error getting profile sections:', error)
      return []
    }
  }

  // Get profile links
  async getProfileLinks(profileId: string): Promise<ProfileLink[]> {
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .select('*')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return data?.map(link => ({
        id: link.id,
        linkType: link.link_type,
        linkUrl: link.link_url,
        linkText: link.link_text,
        isPrimary: link.is_primary,
        sortOrder: link.sort_order
      })) || []
    } catch (error) {
      console.error('Error getting profile links:', error)
      return []
    }
  }

  // Get profile highlights
  async getProfileHighlights(profileId: string): Promise<ProfileHighlight[]> {
    try {
      const { data, error } = await supabase
        .from('profile_highlights')
        .select(`
          *,
          posts (
            id,
            title,
            content,
            image_url,
            created_at
          )
        `)
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return data?.map(highlight => ({
        id: highlight.id,
        postId: highlight.post_id,
        title: highlight.highlight_title,
        isPinned: highlight.is_pinned,
        sortOrder: highlight.sort_order
      })) || []
    } catch (error) {
      console.error('Error getting profile highlights:', error)
      return []
    }
  }

  // Get profile collections
  async getProfileCollections(profileId: string): Promise<ProfileCollection[]> {
    try {
      const { data, error } = await supabase
        .from('profile_collections')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(collection => ({
        id: collection.id,
        name: collection.collection_name,
        description: collection.description,
        isPublic: collection.is_public,
        postCount: collection.post_count
      })) || []
    } catch (error) {
      console.error('Error getting profile collections:', error)
      return []
    }
  }

  // Get profile achievements
  async getProfileAchievements(profileId: string): Promise<ProfileAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('profile_achievements')
        .select('*')
        .eq('profile_id', profileId)
        .order('earned_at', { ascending: false })

      if (error) throw error

      return data?.map(achievement => ({
        id: achievement.id,
        achievementType: achievement.achievement_type,
        achievementName: achievement.achievement_name,
        description: achievement.description,
        iconUrl: achievement.icon_url,
        earnedAt: achievement.earned_at
      })) || []
    } catch (error) {
      console.error('Error getting profile achievements:', error)
      return []
    }
  }

  // Update profile hub settings
  async updateProfileHub(
    profileId: string,
    updates: {
      profileType?: string
      hubTheme?: string
      hubLayout?: string
      hubDescription?: string
      showStats?: boolean
      showFollowers?: boolean
      showPosts?: boolean
      customCss?: string
      bannerUrl?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating profile hub:', error)
      return { success: false, error: error.message }
    }
  }

  // Create profile section
  async createProfileSection(
    profileId: string,
    name: string,
    type: string,
    description?: string,
    isPublic: boolean = true
  ): Promise<{ success: boolean; sectionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profile_sections')
        .insert({
          profile_id: profileId,
          section_name: name,
          section_type: type,
          description,
          is_public: isPublic
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, sectionId: data.id }
    } catch (error) {
      console.error('Error creating profile section:', error)
      return { success: false, error: error.message }
    }
  }

  // Add profile link
  async addProfileLink(
    profileId: string,
    linkType: string,
    linkUrl: string,
    linkText?: string,
    isPrimary: boolean = false
  ): Promise<{ success: boolean; linkId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .insert({
          profile_id: profileId,
          link_type: linkType,
          link_url: linkUrl,
          link_text: linkText,
          is_primary: isPrimary
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, linkId: data.id }
    } catch (error) {
      console.error('Error adding profile link:', error)
      return { success: false, error: error.message }
    }
  }

  // Add profile highlight
  async addProfileHighlight(
    profileId: string,
    postId: string,
    title?: string,
    isPinned: boolean = false
  ): Promise<{ success: boolean; highlightId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profile_highlights')
        .insert({
          profile_id: profileId,
          post_id: postId,
          highlight_title: title,
          is_pinned: isPinned
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, highlightId: data.id }
    } catch (error) {
      console.error('Error adding profile highlight:', error)
      return { success: false, error: error.message }
    }
  }

  // Create profile collection
  async createProfileCollection(
    profileId: string,
    name: string,
    description?: string,
    isPublic: boolean = true
  ): Promise<{ success: boolean; collectionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profile_collections')
        .insert({
          profile_id: profileId,
          collection_name: name,
          description,
          is_public: isPublic
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, collectionId: data.id }
    } catch (error) {
      console.error('Error creating profile collection:', error)
      return { success: false, error: error.message }
    }
  }

  // Add item to collection
  async addToCollection(
    collectionId: string,
    postId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('collection_items')
        .insert({
          collection_id: collectionId,
          post_id: postId
        })

      if (error) throw error

      // Update collection post count
      await supabase.rpc('increment', {
        table_name: 'profile_collections',
        column_name: 'post_count',
        id: collectionId
      })

      return { success: true }
    } catch (error) {
      console.error('Error adding to collection:', error)
      return { success: false, error: error.message }
    }
  }

  // Get profile posts by section
  async getProfilePostsBySection(
    profileId: string,
    sectionType: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_tags (
            content_tags (
              tag_name,
              category
            )
          )
        `)
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error getting profile posts by section:', error)
      return []
    }
  }

  // Update profile stats
  async updateProfileStats(profileId: string, stats: Partial<ProfileStats>): Promise<void> {
    try {
      await supabase
        .from('profile_stats')
        .upsert({
          profile_id: profileId,
          ...stats,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating profile stats:', error)
    }
  }

  // Award achievement
  async awardAchievement(
    profileId: string,
    achievementType: string,
    achievementName: string,
    description?: string,
    iconUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profile_achievements')
        .insert({
          profile_id: profileId,
          achievement_type: achievementType,
          achievement_name: achievementName,
          description,
          icon_url: iconUrl
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error awarding achievement:', error)
      return { success: false, error: error.message }
    }
  }
}

export const profileHubService = new ProfileHubService()
