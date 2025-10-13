/**
 * Engagement Service
 * Handles likes, shares, and saves for posts/listings
 */

import { supabase } from '../lib/supabase';

export interface EngagementStats {
  likeCount: number;
  shareCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface SavedPost {
  id: string;
  post_id: string;
  created_at: string;
  post?: any;
}

/**
 * Toggle like on a post
 */
export async function toggleLike(postId: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
  try {
    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // If table doesn't exist, throw with helpful message
      if (checkError.code === '42P01' || checkError.message?.includes('does not exist')) {
        console.warn('⚠️ likes table does not exist. Please run the migration: supabase/migrations/add_engagement_tables.sql');
        throw new Error('Database tables not set up. Please run migrations.');
      }
      throw checkError;
    }

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;

      // Get updated count
      const { data: post } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .single();

      return { isLiked: false, likeCount: post?.like_count || 0 };
    } else {
      // Like - add the like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });

      if (insertError) throw insertError;

      // Get updated count
      const { data: post } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .single();

      return { isLiked: true, likeCount: post?.like_count || 0 };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

/**
 * Check if user has liked a post
 */
export async function checkIfLiked(postId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

/**
 * Get like count for a post
 */
export async function getLikeCount(postId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single();

    if (error) throw error;

    return data?.like_count || 0;
  } catch (error) {
    console.error('Error getting like count:', error);
    return 0;
  }
}

/**
 * Record a share
 */
export async function recordShare(
  postId: string, 
  userId: string, 
  shareType: 'link' | 'social' | 'embed' = 'link'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('shares')
      .insert({ 
        post_id: postId, 
        user_id: userId,
        share_type: shareType
      });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error recording share:', error);
    return false;
  }
}

/**
 * Get share count for a post
 */
export async function getShareCount(postId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('share_count')
      .eq('id', postId)
      .single();

    if (error) throw error;

    return data?.share_count || 0;
  } catch (error) {
    console.error('Error getting share count:', error);
    return 0;
  }
}

/**
 * Toggle save on a post
 */
export async function toggleSave(postId: string, userId: string): Promise<{ isSaved: boolean }> {
  try {
    // Check if already saved
    const { data: existingSave, error: checkError } = await supabase
      .from('saved_items')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // If table doesn't exist, throw with helpful message
      if (checkError.code === '42P01' || checkError.message?.includes('does not exist')) {
        console.warn('⚠️ saved_items table does not exist. Please run the migration: supabase/migrations/add_engagement_tables.sql');
        throw new Error('Database tables not set up. Please run migrations.');
      }
      throw checkError;
    }

    if (existingSave) {
      // Unsave - remove the save
      const { error: deleteError } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', existingSave.id);

      if (deleteError) throw deleteError;

      return { isSaved: false };
    } else {
      // Save - add the save
      const { error: insertError } = await supabase
        .from('saved_items')
        .insert({ post_id: postId, user_id: userId });

      if (insertError) throw insertError;

      return { isSaved: true };
    }
  } catch (error) {
    console.error('Error toggling save:', error);
    throw error;
  }
}

/**
 * Check if user has saved a post
 */
export async function checkIfSaved(postId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('saved_items')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking save status:', error);
    return false;
  }
}

/**
 * Get all saved posts for a user
 */
export async function getUserSavedPosts(userId: string): Promise<SavedPost[]> {
  try {
    const { data, error } = await supabase
      .from('saved_items')
      .select(`
        id,
        post_id,
        created_at,
        post:posts (
          id,
          title,
          content,
          media_url,
          price_amount,
          currency,
          location,
          category,
          type,
          like_count,
          comment_count,
          share_count,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting saved posts:', error);
    return [];
  }
}

/**
 * Get multiple saved post IDs for a user (efficient for checking many posts)
 */
export async function getUserSavedPostIds(userId: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('saved_items')
      .select('post_id')
      .eq('user_id', userId);

    if (error) {
      // If table doesn't exist, return empty set (migration not run yet)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️ saved_items table does not exist. Please run the migration: supabase/migrations/add_engagement_tables.sql');
        return new Set();
      }
      throw error;
    }

    return new Set((data || []).map(item => item.post_id));
  } catch (error) {
    console.error('Error getting saved post IDs:', error);
    return new Set();
  }
}

/**
 * Get engagement stats for a post
 */
export async function getEngagementStats(postId: string, userId?: string): Promise<EngagementStats> {
  try {
    // Get post stats
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('like_count, share_count, comment_count')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    let isLiked = false;
    let isSaved = false;

    // If user is provided, check their engagement
    if (userId) {
      const [likedResult, savedResult] = await Promise.all([
        checkIfLiked(postId, userId),
        checkIfSaved(postId, userId)
      ]);

      isLiked = likedResult;
      isSaved = savedResult;
    }

    return {
      likeCount: post?.like_count || 0,
      shareCount: post?.share_count || 0,
      commentCount: post?.comment_count || 0,
      isLiked,
      isSaved
    };
  } catch (error) {
    console.error('Error getting engagement stats:', error);
    return {
      likeCount: 0,
      shareCount: 0,
      commentCount: 0,
      isLiked: false,
      isSaved: false
    };
  }
}

/**
 * Batch check if posts are saved (efficient for feed pages)
 */
export async function batchCheckSaved(postIds: string[], userId: string): Promise<Map<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from('saved_items')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (error) throw error;

    const savedMap = new Map<string, boolean>();
    postIds.forEach(id => savedMap.set(id, false));
    (data || []).forEach(item => savedMap.set(item.post_id, true));

    return savedMap;
  } catch (error) {
    console.error('Error batch checking saved posts:', error);
    return new Map();
  }
}

/**
 * Batch check if posts are liked (efficient for feed pages)
 */
export async function batchCheckLiked(postIds: string[], userId: string): Promise<Map<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (error) throw error;

    const likedMap = new Map<string, boolean>();
    postIds.forEach(id => likedMap.set(id, false));
    (data || []).forEach(item => likedMap.set(item.post_id, true));

    return likedMap;
  } catch (error) {
    console.error('Error batch checking liked posts:', error);
    return new Map();
  }
}

