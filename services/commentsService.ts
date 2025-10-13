/**
 * Comments Service
 * Handles comment creation, moderation, and retrieval
 */

import { supabase } from '../lib/supabase';
import { checkPostForInappropriateContent } from './moderationService';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  gif_url?: string;
  like_count: number;
  dislike_count?: number;
  is_pinned?: boolean;
  is_deleted: boolean;
  is_edited?: boolean;
  is_flagged: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  edited_at?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  replies?: Comment[];
  user_reaction?: 'like' | 'dislike' | null;
}

export interface CreateCommentData {
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
}

/**
 * Create a new comment with automatic moderation
 */
export async function createComment(data: CreateCommentData): Promise<Comment | null> {
  try {
    // Check content for inappropriate material
    const isFlagged = checkPostForInappropriateContent({
      content: data.content,
      title: ''
    });

    // Determine moderation status
    const moderationStatus = isFlagged ? 'pending' : 'approved';

    // Build insert object - start with minimum required fields
    const insertData: any = {
      post_id: data.post_id,
      user_id: data.user_id,
      content: data.content
    };

    console.log('📝 Creating comment with data:', insertData);

    // Insert comment with minimal fields first
    const { data: comment, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Try adding parent_id if provided (for schemas that support it)
      if (data.parent_id && error.message?.includes('parent_id')) {
        insertData.parent_id = data.parent_id;
        const retryResult = await supabase
          .from('comments')
          .insert(insertData)
          .select()
          .single();
        
        if (retryResult.error) throw retryResult.error;
        if (!retryResult.data) throw new Error('No data returned');
        
        return retryResult.data as Comment;
      }
      throw error;
    }

    if (!comment) {
      throw new Error('No comment data returned');
    }

    // Fetch with profile info
    const { data: fullComment } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('id', comment.id)
      .single();

    return (fullComment || comment) as Comment;
  } catch (error: any) {
    console.error('❌ Error in createComment (full error):', error);
    console.error('❌ Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      statusCode: error?.statusCode,
      name: error?.name
    });
    
    // Check if it's a schema issue
    if (error?.message?.includes('parent_id') || error?.message?.includes('column')) {
      console.error('🔧 SCHEMA ISSUE: The comments table may be missing columns.');
      console.error('🔧 SOLUTION: Run this migration in Supabase SQL Editor:');
      console.error('🔧 supabase/migrations/fix_comments_schema.sql');
    }
    
    return null;
  }
}

/**
 * Get comments for a post
 */
export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .in('moderation_status', ['approved']) // Only show approved comments
      .order('created_at', { ascending: false }); // Newest first

    if (error) {
      // If table doesn't exist, return empty array (migration not run yet)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️ comments table does not exist. Please run the migration: supabase/migrations/add_engagement_tables.sql');
        return [];
      }
      console.error('Error getting comments:', error);
      throw error;
    }

    return (data || []) as Comment[];
  } catch (error) {
    console.error('Error in getComments:', error);
    return [];
  }
}

/**
 * Get comments with replies organized in a tree structure
 */
export async function getCommentsWithReplies(postId: string): Promise<Comment[]> {
  try {
    const comments = await getComments(postId);
    
    console.log(`💬 Fetched ${comments.length} total comments for post ${postId}`);
    
    // If no comments (including when table doesn't exist), return empty array
    if (!comments || comments.length === 0) {
      return [];
    }

    // Log profile data
    comments.forEach((c, i) => {
      console.log(`Comment ${i + 1}:`, {
        id: c.id.substring(0, 8),
        content: c.content.substring(0, 30),
        has_profile: !!c.profiles,
        profile_name: c.profiles?.name,
        parent_id: c.parent_id ? c.parent_id.substring(0, 8) : 'none'
      });
    });

    // Organize into tree structure
    const commentMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];

    // First pass: create map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize hierarchy
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        // This is a reply
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
          console.log(`↳ Reply nested under parent: ${comment.parent_id.substring(0, 8)}`);
        } else {
          console.warn(`⚠️ Parent comment not found for reply: ${comment.id.substring(0, 8)}`);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentWithReplies);
      }
    });

    console.log(`📊 Organized into ${topLevelComments.length} top-level comments`);

    // Sort replies within each comment by oldest first (conversation flow)
    const sortReplies = (comment: Comment) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        console.log(`  Comment has ${comment.replies.length} replies`);
        // Recursively sort nested replies
        comment.replies.forEach(reply => sortReplies(reply));
      }
    };

    topLevelComments.forEach(comment => sortReplies(comment));

    return topLevelComments;
  } catch (error) {
    console.error('Error in getCommentsWithReplies:', error);
    return [];
  }
}

/**
 * Update a comment
 */
export async function updateComment(commentId: string, content: string, userId: string): Promise<boolean> {
  try {
    // Check content for inappropriate material
    const isFlagged = checkPostForInappropriateContent({
      content,
      title: ''
    });

    const moderationStatus = isFlagged ? 'pending' : 'approved';

    const { error } = await supabase
      .from('comments')
      .update({
        content,
        is_flagged: isFlagged,
        moderation_status: moderationStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId); // Ensure user owns the comment

    if (error) {
      console.error('Error updating comment:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in updateComment:', error);
    return false;
  }
}

/**
 * Soft delete a comment
 */
export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)
      .eq('user_id', userId); // Ensure user owns the comment

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return false;
  }
}

/**
 * Get comment count for a post
 */
export async function getCommentCount(postId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('comment_count')
      .eq('id', postId)
      .single();

    if (error) throw error;

    return data?.comment_count || 0;
  } catch (error) {
    console.error('Error getting comment count:', error);
    return 0;
  }
}

/**
 * Get pending comments for moderation (admin only)
 */
export async function getPendingComments(): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!comments_user_id_fkey (
          id,
          name,
          username,
          avatar_url
        ),
        post:posts!comments_post_id_fkey (
          id,
          title,
          content
        )
      `)
      .eq('moderation_status', 'pending')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting pending comments:', error);
      throw error;
    }

    return (data || []) as Comment[];
  } catch (error) {
    console.error('Error in getPendingComments:', error);
    return [];
  }
}

/**
 * Approve a comment (admin only)
 */
export async function approveComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        moderation_status: 'approved',
        is_flagged: false
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error approving comment:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in approveComment:', error);
    return false;
  }
}

/**
 * Reject a comment (admin only)
 */
export async function rejectComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        moderation_status: 'rejected',
        is_deleted: true
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error rejecting comment:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in rejectComment:', error);
    return false;
  }
}

/**
 * React to a comment (like or dislike)
 */
export async function reactToComment(
  commentId: string, 
  reactionType: 'like' | 'dislike'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user already reacted
    const { data: existing } = await supabase
      .from('comment_reactions')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // If same reaction, remove it (toggle off)
      if (existing.reaction_type === reactionType) {
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { success: true };
      } else {
        // If different reaction, update it
        const { error } = await supabase
          .from('comment_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existing.id);

        if (error) throw error;
        return { success: true };
      }
    } else {
      // No existing reaction, create new one
      const { error } = await supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType
        });

      if (error) throw error;
      return { success: true };
    }
  } catch (error: any) {
    console.error('Error reacting to comment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's reaction to a comment
 */
export async function getUserReaction(commentId: string): Promise<'like' | 'dislike' | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('comment_reactions')
      .select('reaction_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    return data?.reaction_type as 'like' | 'dislike' | null;
  } catch (error) {
    return null;
  }
}

/**
 * Pin/Unpin a comment (post owner or admin only)
 */
export async function toggleCommentPin(commentId: string, postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user owns the post
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== user.id) {
      return { success: false, error: 'Only post owner can pin comments' };
    }

    // Get current pin status
    const { data: comment } = await supabase
      .from('comments')
      .select('is_pinned')
      .eq('id', commentId)
      .single();

    // Toggle pin status
    const { error } = await supabase
      .from('comments')
      .update({ is_pinned: !comment?.is_pinned })
      .eq('id', commentId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling comment pin:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update comment with GIF
 */
export async function addGifToComment(commentId: string, gifUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('comments')
      .update({ 
        gif_url: gifUrl,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error adding GIF to comment:', error);
    return { success: false, error: error.message };
  }
}

