/**
 * Followers Service
 * Handles user following/unfollowing functionality
 */

import { supabase } from '@/lib/supabase'

export interface FollowerRelationship {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface FollowerStats {
  followers_count: number
  following_count: number
  is_following?: boolean
}

export interface UserFollowerInfo {
  user_id: string
  name: string
  username: string
  avatar_url: string
  followers_count: number
  following_count: number
}

export class FollowersService {
  /**
   * Follow a user
   */
  static async followUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      if (user.id === userId) {
        return { success: false, error: 'Cannot follow yourself' }
      }

      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: userId
        })

      if (error) {
        // If table doesn't exist yet, silently fail
        if (error.code === '42P01' || 
            error.message?.includes('does not exist') || 
            error.message?.includes('schema cache')) {
          return { 
            success: false, 
            error: 'Followers feature not set up yet. Run the database migration to enable.' 
          }
        }
        console.warn('Error following user:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      // Silent fail for missing tables
      if (error?.message?.includes('does not exist') || 
          error?.message?.includes('relation') ||
          error?.message?.includes('schema cache')) {
        return { success: false, error: 'Followers feature not set up yet' }
      }
      console.warn('Unexpected error following user:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId)

      if (error) {
        // Silent for missing tables
        if (error.code === '42P01' || 
            error.message?.includes('does not exist') || 
            error.message?.includes('schema cache')) {
          return { success: false, error: 'Followers feature not set up yet' }
        }
        console.warn('Error unfollowing user:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      // Silent fail for missing tables
      if (error?.message?.includes('does not exist') || 
          error?.message?.includes('relation') ||
          error?.message?.includes('schema cache')) {
        return { success: false, error: 'Followers feature not set up yet' }
      }
      console.warn('Unexpected error unfollowing user:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check if current user is following another user
   */
  static async isFollowing(userId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        // If table doesn't exist, silently return false
        if (error.code === '42P01' || 
            error.message?.includes('does not exist') || 
            error.message?.includes('relation') ||
            error.message?.includes('schema cache')) {
          return false
        }
        // Only log real errors, not missing table errors
        console.warn('Error checking follow status:', error)
      }

      return !!data
    } catch (error) {
      // Silent fail for missing tables
      return false
    }
  }

  /**
   * Get follower stats for a user
   */
  static async getFollowerStats(userId: string): Promise<FollowerStats> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      // Get follower and following counts
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('followers_count, following_count')
        .eq('id', userId)
        .single()

      if (profileError) {
        // If followers columns don't exist, return zeros gracefully and silently
        if (profileError.code === '42703' || 
            profileError.message?.includes('column') || 
            profileError.message?.includes('followers') ||
            profileError.message?.includes('does not exist')) {
          // Silent return - no console spam
          return { followers_count: 0, following_count: 0, is_following: false }
        }
        // Only log non-migration errors
        console.warn('Error fetching follower stats:', profileError)
        return { followers_count: 0, following_count: 0, is_following: false }
      }

      // Check if current user is following this user
      let isFollowing = false
      if (currentUser) {
        isFollowing = await this.isFollowing(userId)
      }

      return {
        followers_count: profile?.followers_count || 0,
        following_count: profile?.following_count || 0,
        is_following: isFollowing
      }
    } catch (error: any) {
      // Silent fail for missing tables/columns
      if (error?.message?.includes('does not exist') || 
          error?.message?.includes('column') ||
          error?.message?.includes('schema cache')) {
        return { followers_count: 0, following_count: 0, is_following: false }
      }
      console.warn('Unexpected error getting follower stats:', error)
      return { followers_count: 0, following_count: 0, is_following: false }
    }
  }

  /**
   * Get list of followers for a user
   */
  static async getFollowers(userId: string, limit = 50, offset = 0): Promise<{
    success: boolean
    followers: UserFollowerInfo[]
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          follower_id,
          profiles:follower_id (
            id,
            name,
            username,
            avatar_url,
            followers_count,
            following_count
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        // Silent for missing tables
        if (error.code === '42P01' || 
            error.message?.includes('does not exist') || 
            error.message?.includes('schema cache')) {
          return { success: true, followers: [] }
        }
        console.warn('Error fetching followers:', error)
        return { success: false, followers: [], error: error.message }
      }

      const followers = data.map((item: any) => ({
        user_id: item.profiles.id,
        name: item.profiles.name,
        username: item.profiles.username,
        avatar_url: item.profiles.avatar_url,
        followers_count: item.profiles.followers_count || 0,
        following_count: item.profiles.following_count || 0
      }))

      return { success: true, followers }
    } catch (error: any) {
      // Silent for missing tables
      if (error?.message?.includes('does not exist') || 
          error?.message?.includes('schema cache')) {
        return { success: true, followers: [] }
      }
      console.warn('Unexpected error fetching followers:', error)
      return { success: false, followers: [], error: error.message }
    }
  }

  /**
   * Get list of users that a user is following
   */
  static async getFollowing(userId: string, limit = 50, offset = 0): Promise<{
    success: boolean
    following: UserFollowerInfo[]
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          following_id,
          profiles:following_id (
            id,
            name,
            username,
            avatar_url,
            followers_count,
            following_count
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        // Silent for missing tables
        if (error.code === '42P01' || 
            error.message?.includes('does not exist') || 
            error.message?.includes('schema cache')) {
          return { success: true, following: [] }
        }
        console.warn('Error fetching following:', error)
        return { success: false, following: [], error: error.message }
      }

      const following = data.map((item: any) => ({
        user_id: item.profiles.id,
        name: item.profiles.name,
        username: item.profiles.username,
        avatar_url: item.profiles.avatar_url,
        followers_count: item.profiles.followers_count || 0,
        following_count: item.profiles.following_count || 0
      }))

      return { success: true, following }
    } catch (error: any) {
      // Silent for missing tables
      if (error?.message?.includes('does not exist') || 
          error?.message?.includes('schema cache')) {
        return { success: true, following: [] }
      }
      console.warn('Unexpected error fetching following:', error)
      return { success: false, following: [], error: error.message }
    }
  }

  /**
   * Get mutual followers (users who follow each other)
   */
  static async getMutualFollowers(userId: string): Promise<{
    success: boolean
    mutuals: UserFollowerInfo[]
    error?: string
  }> {
    try {
      // Get users that both follow and are followed by the user
      const { data, error } = await supabase
        .rpc('get_mutual_followers', { user_id: userId })

      if (error) {
        // Silent for missing tables/functions
        if (error.code === '42P01' || 
            error.message?.includes('does not exist') || 
            error.message?.includes('schema cache')) {
          return { success: true, mutuals: [] }
        }
        console.warn('Error fetching mutual followers:', error)
        return { success: false, mutuals: [], error: error.message }
      }

      return { success: true, mutuals: data || [] }
    } catch (error: any) {
      // Silent for missing tables
      if (error?.message?.includes('does not exist') || 
          error?.message?.includes('schema cache')) {
        return { success: true, mutuals: [] }
      }
      console.warn('Unexpected error fetching mutual followers:', error)
      return { success: false, mutuals: [], error: error.message }
    }
  }
}

