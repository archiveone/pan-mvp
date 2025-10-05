import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
// FIX: Added ChatGroup to the import from '../types'.
import type { Post, ChatGroup } from '../types';
import { MOCK_POSTS } from '../constants';
import { checkPostForInappropriateContent } from '../services/moderationService';
import { supabase } from '../services/supabaseClient';

// FIX: Added communities, chatGroups, and addChatGroup to the context type.
interface PostsContextType {
  posts: Post[];
  communities: Post[];
  chatGroups: ChatGroup[];
  addPost: (newPost: Post) => void;
  deletePost: (postId: string) => void;
  addChatGroup: (group: { communityId: string; name: string; description: string; }) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialPosts = useMemo(() => {
    return MOCK_POSTS.map(post => ({
      ...post,
      isFlagged: checkPostForInappropriateContent(post),
    }));
  }, []);
  
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  // FIX: Added state to manage chat groups.
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);

  const addPost = useCallback(async (newPost: Post) => {
    // Perform moderation check
    const isFlagged = checkPostForInappropriateContent(newPost);
    
    const postToSave: Post = {
        ...newPost,
        isFlagged,
    };

    // Try Supabase first, fallback to local
    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { data, error } = await supabase.from('posts').insert({
          user_id: newPost.user.id,
          type: newPost.postType,
          title: newPost.title,
          content: newPost.content,
          media_url: newPost.imageUrl || newPost.videoUrl,
          price_amount: newPost.priceInfo?.amount,
          price_unit: newPost.priceInfo?.unit,
          location: newPost.location,
          datetime: newPost.dateTime,
          is_flagged: isFlagged,
          parent_id: newPost.parentId,
        }).select().single();
        if (error) throw error;
        // TODO: reload posts from DB
      }
    } catch (err) {
      console.error('Supabase insert failed, using local', err);
    }

    // Add the new post to the beginning of the array for immediate visibility
    setPosts(prevPosts => [postToSave, ...prevPosts]);
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  }, []);

  // Load posts from Supabase on mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        if (import.meta.env.VITE_SUPABASE_URL) {
          const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          // TODO: transform data to Post[] format
          return;
        }
      } catch (err) {
        console.error('Failed to load posts from Supabase', err);
      }
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem('pan_posts');
        if (raw) setPosts(JSON.parse(raw));
      } catch {}
    };
    loadPosts();
  }, []);

  // FIX: Added function to create a new chat group.
  const addChatGroup = useCallback((group: { communityId: string; name: string; description: string; }) => {
      const newGroup: ChatGroup = {
          id: `cg-${Date.now()}`,
          ...group
      };
      setChatGroups(prev => [...prev, newGroup]);
  }, []);
  
  // FIX: Derived communities from the main posts array for consistency.
  const communities = useMemo(() => posts.filter(p => p.postType === 'COMMUNITY'), [posts]);

  // FIX: Added new state and functions to the context value.
  const value = { posts, addPost, deletePost, communities, chatGroups, addChatGroup };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = (): PostsContextType => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};