import { supabase } from '@/lib/supabase'

export interface Story {
  id: string
  user_id: string
  content_type: 'image' | 'video' | 'live'
  media_url?: string
  text_overlay?: string
  background_color?: string
  duration?: number // in seconds
  views_count: number
  created_at: string
  expires_at: string
  is_live?: boolean
  live_stream_url?: string
  profiles?: {
    id: string
    name: string
    username: string
    avatar_url: string
  }
}

export interface LiveStream {
  id: string
  user_id: string
  title: string
  description?: string
  stream_key: string
  stream_url: string
  playback_url: string
  is_active: boolean
  viewer_count: number
  started_at: string
  ended_at?: string
  total_donations: number
}

export interface Donation {
  id: string
  live_stream_id: string
  from_user_id: string
  amount: number
  currency: string
  message?: string
  created_at: string
}

export class StoriesService {
  // Create a new story
  static async createStory(data: {
    userId: string
    contentType: 'image' | 'video' | 'live'
    mediaUrl?: string
    textOverlay?: string
    backgroundColor?: string
    duration?: number
  }): Promise<{ success: boolean; story?: Story; error?: string }> {
    try {
      // Stories expire after 24 hours
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          user_id: data.userId,
          content_type: data.contentType,
          media_url: data.mediaUrl,
          text_overlay: data.textOverlay,
          background_color: data.backgroundColor,
          duration: data.duration || 5,
          expires_at: expiresAt.toISOString(),
          views_count: 0,
          is_live: data.contentType === 'live'
        })
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      return { success: true, story: story as Story }
    } catch (error: any) {
      console.error('Create story error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get stories from followed users
  static async getFollowedUsersStories(userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const now = new Date().toISOString()

      // Get followed users' stories
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group stories by user
      const groupedStories: any[] = []
      const userMap = new Map()

      stories?.forEach((story: any) => {
        const userId = story.user_id
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            username: story.profiles?.username || story.profiles?.name || 'User',
            avatar_url: story.profiles?.avatar_url,
            stories: [],
            hasUnviewed: false
          })
          groupedStories.push(userMap.get(userId))
        }
        userMap.get(userId).stories.push(story)
      })

      return { success: true, data: groupedStories }
    } catch (error: any) {
      console.error('Get followed users stories error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get my own stories
  static async getMyStories(userId: string): Promise<{ success: boolean; data?: Story[]; error?: string }> {
    try {
      const now = new Date().toISOString()

      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: stories as Story[] }
    } catch (error: any) {
      console.error('Get my stories error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get active stories (not expired)
  static async getActiveStories(): Promise<{ success: boolean; stories?: Story[]; error?: string }> {
    try {
      const now = new Date().toISOString()

      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, stories: stories as Story[] }
    } catch (error: any) {
      console.error('Get stories error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user's stories
  static async getUserStories(userId: string): Promise<{ success: boolean; stories?: Story[]; error?: string }> {
    try {
      const now = new Date().toISOString()

      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, stories: stories as Story[] }
    } catch (error: any) {
      console.error('Get user stories error:', error)
      return { success: false, error: error.message }
    }
  }

  // Increment story views
  static async incrementViews(storyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('increment_story_views', { story_id: storyId })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Increment views error:', error)
      return { success: false, error: error.message }
    }
  }

  // Delete story
  static async deleteStory(storyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Delete story error:', error)
      return { success: false, error: error.message }
    }
  }

  // === LIVE STREAMING ===

  // Start a live stream
  static async startLiveStream(data: {
    userId: string
    title: string
    description?: string
  }): Promise<{ success: boolean; stream?: LiveStream; error?: string }> {
    try {
      // Generate unique stream key
      const streamKey = `live_${data.userId}_${Date.now()}`
      const streamUrl = `rtmp://live.pan.app/live/${streamKey}`
      const playbackUrl = `https://live.pan.app/hls/${streamKey}.m3u8`

      const { data: stream, error } = await supabase
        .from('live_streams')
        .insert({
          user_id: data.userId,
          title: data.title,
          description: data.description,
          stream_key: streamKey,
          stream_url: streamUrl,
          playback_url: playbackUrl,
          is_active: true,
          viewer_count: 0,
          started_at: new Date().toISOString(),
          total_donations: 0
        })
        .select()
        .single()

      if (error) throw error

      // Create a live story
      await this.createStory({
        userId: data.userId,
        contentType: 'live',
        mediaUrl: playbackUrl,
        duration: 0
      })

      return { success: true, stream: stream as LiveStream }
    } catch (error: any) {
      console.error('Start live stream error:', error)
      return { success: false, error: error.message }
    }
  }

  // End live stream
  static async endLiveStream(streamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', streamId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('End live stream error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get active live streams
  static async getActiveLiveStreams(): Promise<{ success: boolean; streams?: LiveStream[]; error?: string }> {
    try {
      const { data: streams, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false })

      if (error) throw error

      return { success: true, streams: streams as LiveStream[] }
    } catch (error: any) {
      console.error('Get live streams error:', error)
      return { success: false, error: error.message }
    }
  }

  // Update viewer count
  static async updateViewerCount(streamId: string, count: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({ viewer_count: count })
        .eq('id', streamId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Update viewer count error:', error)
      return { success: false, error: error.message }
    }
  }

  // === DONATIONS ===

  // Send donation to live stream
  static async sendDonation(data: {
    streamId: string
    fromUserId: string
    amount: number
    currency: string
    message?: string
  }): Promise<{ success: boolean; donation?: Donation; error?: string }> {
    try {
      const { data: donation, error } = await supabase
        .from('live_donations')
        .insert({
          live_stream_id: data.streamId,
          from_user_id: data.fromUserId,
          amount: data.amount,
          currency: data.currency,
          message: data.message,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Update total donations
      await supabase.rpc('increment_stream_donations', {
        stream_id: data.streamId,
        donation_amount: data.amount
      })

      return { success: true, donation: donation as Donation }
    } catch (error: any) {
      console.error('Send donation error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get donations for a stream
  static async getStreamDonations(streamId: string): Promise<{ success: boolean; donations?: Donation[]; error?: string }> {
    try {
      const { data: donations, error } = await supabase
        .from('live_donations')
        .select('*')
        .eq('live_stream_id', streamId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, donations: donations as Donation[] }
    } catch (error: any) {
      console.error('Get donations error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default StoriesService
