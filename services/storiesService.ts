import { supabase } from '@/lib/supabase';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  caption?: string;
  duration: number;
  editor_data: any;
  audio_url?: string;
  audio_name?: string;
  view_count: number;
  is_public: boolean;
  created_at: string;
  expires_at: string;
  profiles?: {
    id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export interface UserStories {
  user_id: string;
  username: string;
  avatar_url?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

export class StoriesService {
  /**
   * Get stories from users you follow (not expired) grouped by user
   */
  static async getFollowedUsersStories(currentUserId: string): Promise<{
    success: boolean;
    data?: UserStories[];
    error?: string;
  }> {
    try {
      // First, get the list of users the current user is following
      const { data: following, error: followError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUserId);

      if (followError) throw followError;

      if (!following || following.length === 0) {
        return { success: true, data: [] };
      }

      const followingIds = following.map(f => f.following_id);

      // Get stories from followed users only
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
        .in('user_id', followingIds)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!stories || stories.length === 0) {
        return { success: true, data: [] };
      }

      // Get viewed stories for current user
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', currentUserId);
      
      const viewedStoryIds = views?.map(v => v.story_id) || [];

      // Group stories by user
      const userStoriesMap = new Map<string, UserStories>();

      stories.forEach((story: any) => {
        const userId = story.user_id;
        const profile = story.profiles;

        if (!userStoriesMap.has(userId)) {
          userStoriesMap.set(userId, {
            user_id: userId,
            username: profile?.username || profile?.name || 'User',
            avatar_url: profile?.avatar_url,
            stories: [],
            hasUnviewed: false
          });
        }

        const userStories = userStoriesMap.get(userId)!;
        userStories.stories.push(story);

        // Check if any story is unviewed
        if (!viewedStoryIds.includes(story.id)) {
          userStories.hasUnviewed = true;
        }
      });

      // Convert map to array and sort by unviewed first
      const userStoriesArray = Array.from(userStoriesMap.values())
        .sort((a, b) => {
          if (a.hasUnviewed && !b.hasUnviewed) return -1;
          if (!a.hasUnviewed && b.hasUnviewed) return 1;
          return 0;
        });

      return { success: true, data: userStoriesArray };
    } catch (error) {
      console.error('Error loading followed users stories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load stories'
      };
    }
  }

  /**
   * Get all active stories (not expired) grouped by user (for explore/discovery)
   */
  static async getActiveStories(currentUserId?: string): Promise<{
    success: boolean;
    data?: UserStories[];
    error?: string;
  }> {
    try {
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
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!stories || stories.length === 0) {
        return { success: true, data: [] };
      }

      // Get viewed stories for current user
      let viewedStoryIds: string[] = [];
      if (currentUserId) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', currentUserId);
        
        viewedStoryIds = views?.map(v => v.story_id) || [];
      }

      // Group stories by user
      const userStoriesMap = new Map<string, UserStories>();

      stories.forEach((story: any) => {
        const userId = story.user_id;
        const profile = story.profiles;

        if (!userStoriesMap.has(userId)) {
          userStoriesMap.set(userId, {
            user_id: userId,
            username: profile?.username || profile?.name || 'User',
            avatar_url: profile?.avatar_url,
            stories: [],
            hasUnviewed: false
          });
        }

        const userStories = userStoriesMap.get(userId)!;
        userStories.stories.push(story);

        // Check if any story is unviewed
        if (!viewedStoryIds.includes(story.id)) {
          userStories.hasUnviewed = true;
        }
      });

      // Convert map to array and sort by unviewed first
      const userStoriesArray = Array.from(userStoriesMap.values())
        .sort((a, b) => {
          if (a.hasUnviewed && !b.hasUnviewed) return -1;
          if (!a.hasUnviewed && b.hasUnviewed) return 1;
          return 0;
        });

      return { success: true, data: userStoriesArray };
    } catch (error) {
      console.error('Error loading stories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load stories'
      };
    }
  }

  /**
   * Get user's own stories
   */
  static async getMyStories(userId: string): Promise<{
    success: boolean;
    data?: Story[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error loading my stories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load stories'
      };
    }
  }

  /**
   * Create a new story
   */
  static async createStory(storyData: {
    user_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    thumbnail_url?: string;
    caption?: string;
    duration?: number;
    editor_data?: any;
    audio_url?: string;
    audio_name?: string;
  }): Promise<{
    success: boolean;
    data?: Story;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          ...storyData,
          duration: storyData.duration || 5,
          editor_data: storyData.editor_data || {},
          is_public: true,
          view_count: 0,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating story:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create story'
      };
    }
  }

  /**
   * Delete a story
   */
  static async deleteStory(storyId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting story:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete story'
      };
    }
  }

  /**
   * Mark story as viewed
   */
  static async markStoryViewed(storyId: string, viewerId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Insert view record
      const { error: viewError } = await supabase
        .from('story_views')
        .upsert({
          story_id: storyId,
          viewer_id: viewerId,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'story_id,viewer_id'
        });

      if (viewError) throw viewError;

      // Increment view count
      const { error: updateError } = await supabase.rpc('increment_story_views', {
        story_id: storyId
      });

      if (updateError) {
        // Fallback: manually increment if RPC doesn't exist
        const { error: manualError } = await supabase
          .from('stories')
          .update({ view_count: supabase.raw('view_count + 1') })
          .eq('id', storyId);
        
        if (manualError) throw manualError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking story as viewed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark story as viewed'
      };
    }
  }

  /**
   * Add reaction to story
   */
  static async addReaction(storyId: string, userId: string, reactionType: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('story_reactions')
        .upsert({
          story_id: storyId,
          user_id: userId,
          reaction_type: reactionType,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'story_id,user_id'
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add reaction'
      };
    }
  }

  /**
   * Get story viewers
   */
  static async getStoryViewers(storyId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('story_views')
        .select(`
          *,
          profiles:viewer_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error loading story viewers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load viewers'
      };
    }
  }

  /**
   * Clean up expired stories (call this periodically)
   */
  static async cleanupExpiredStories(): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
      console.error('Error cleaning up stories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup stories'
      };
    }
  }
}

