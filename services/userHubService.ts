import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  created_at: string;
}

export interface SavedPost {
  id: string;
  post_id: string;
  created_at: string;
  posts: {
    id: string;
    title: string;
    content: string;
    price: number;
    currency: string;
    created_at: string;
  };
}

export interface UserGroup {
  id: string;
  group_id: string;
  role: string;
  joined_at: string;
  groups: {
    id: string;
    name: string;
    description: string;
    image_url: string;
  };
}

export interface PortfolioFile {
  id: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface UserAnalytics {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_saves: number;
  total_posts: number;
}

// Get user's posts
export async function getUserPosts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get user's saved posts
export async function getSavedPosts(userId: string) {
  try {
    // First, get the saved_posts records
    const { data: savedPosts, error: savedError } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (savedError) throw savedError;

    // If no saved posts, return empty array
    if (!savedPosts || savedPosts.length === 0) {
      return { success: true, data: [] };
    }

    // Get the post IDs
    const postIds = savedPosts.map(sp => sp.post_id);

    // Fetch the actual posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, content, price, currency, created_at')
      .in('id', postIds);

    if (postsError) throw postsError;

    // Combine the data
    const combinedData = savedPosts.map(savedPost => {
      const post = posts?.find(p => p.id === savedPost.post_id);
      return {
        ...savedPost,
        posts: post
      };
    });

    return { success: true, data: combinedData };
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Save a post
export async function savePost(userId: string, postId: string) {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .insert({
        user_id: userId,
        post_id: postId
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving post:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Remove saved post
export async function unsavePost(userId: string, postId: string) {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error unsaving post:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get user's groups
export async function getUserGroups(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_groups')
      .select(`
        *,
        groups (
          id,
          name,
          description,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Join a group
export async function joinGroup(userId: string, groupId: string) {
  try {
    const { data, error } = await supabase
      .from('user_groups')
      .insert({
        user_id: userId,
        group_id: groupId,
        role: 'member'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error joining group:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Leave a group
export async function leaveGroup(userId: string, groupId: string) {
  try {
    const { error } = await supabase
      .from('user_groups')
      .delete()
      .eq('user_id', userId)
      .eq('group_id', groupId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error leaving group:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get user's portfolio files
export async function getPortfolioFiles(userId: string) {
  try {
    const { data, error } = await supabase
      .from('portfolio_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching portfolio files:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Upload portfolio file
export async function uploadPortfolioFile(userId: string, fileData: {
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
}) {
  try {
    const { data, error } = await supabase
      .from('portfolio_files')
      .insert({
        user_id: userId,
        ...fileData
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error uploading portfolio file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Delete portfolio file
export async function deletePortfolioFile(userId: string, fileId: string) {
  try {
    const { error } = await supabase
      .from('portfolio_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting portfolio file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get user analytics
export async function getUserAnalytics(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_analytics_summary', { user_uuid: userId });

    if (error) throw error;
    return { success: true, data: data?.[0] || {
      total_views: 0,
      total_likes: 0,
      total_shares: 0,
      total_saves: 0,
      total_posts: 0
    }};
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Track analytics event
export async function trackAnalyticsEvent(userId: string, postId: string, eventType: 'view' | 'like' | 'share' | 'save') {
  try {
    const { error } = await supabase
      .from('user_analytics')
      .insert({
        user_id: userId,
        post_id: postId,
        event_type: eventType
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Update user profile - using profiles table
export async function updateUserProfile(userId: string, profileData: {
  username?: string;
  bio?: string;
  avatar_url?: string;
  full_name?: string;
  name?: string;
}) {
  try {
    console.log('Attempting to update profile for user:', userId, 'with data:', profileData);
    
    // First, check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking existing profile:', fetchError);
      throw fetchError;
    }

    const updateData = {
      name: profileData.name || profileData.full_name || profileData.username,
      username: profileData.username,
      bio: profileData.bio,
      avatar_url: profileData.avatar_url
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    if (existingProfile) {
      // Update existing profile
      console.log('Updating existing profile with data:', updateData);
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update failed:', profileError);
        console.error('Profile update error details:', JSON.stringify(profileError, null, 2));
        console.error('Profile update error message:', profileError.message);
        console.error('Profile update error code:', profileError.code);
        console.error('Profile update error hint:', profileError.hint);
        throw profileError;
      }

      console.log('Profile update successful:', profileResult);
      return { success: true, data: profileResult };
    } else {
      // Insert new profile
      console.log('Creating new profile with data:', updateData);
      const { data: insertResult, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: updateData.name || 'User',
          username: updateData.username,
          bio: updateData.bio || 'Welcome to Pan!',
          avatar_url: updateData.avatar_url
        })
        .select()
        .single();

      if (insertError) {
        console.error('Profile insert failed:', insertError);
        console.error('Profile insert error details:', JSON.stringify(insertError, null, 2));
        console.error('Profile insert error message:', insertError.message);
        console.error('Profile insert error code:', insertError.code);
        console.error('Profile insert error hint:', insertError.hint);
        throw insertError;
      }

      console.log('Profile insert successful:', insertResult);
      return { success: true, data: insertResult };
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    console.error('Error type:', typeof error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
