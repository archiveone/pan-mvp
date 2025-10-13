import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  toggleSave as toggleSaveInDB, 
  getUserSavedPostIds,
  checkIfSaved 
} from '../services/engagementService';

const SAVED_POSTS_KEY = 'savedPosts';

/**
 * Custom hook to manage saved posts using Supabase database.
 * Falls back to localStorage if user is not authenticated.
 * @returns An object with a function to check if a post is saved
 * and a function to toggle the save state.
 */
export function useSavedPosts() {
  const { user } = useAuth();
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load saved posts on mount
  useEffect(() => {
    async function loadSavedPosts() {
      try {
        if (user?.id) {
          // Try to load from database if authenticated
          try {
            const savedIds = await getUserSavedPostIds(user.id);
            setSavedPostIds(savedIds);
            console.log('✅ Loaded', savedIds.size, 'saved posts from database');
          } catch (dbError) {
            // If database fails (tables not created yet), fall back to localStorage
            console.warn('⚠️ Database not ready, using localStorage fallback');
            const item = window.localStorage.getItem(SAVED_POSTS_KEY);
            const ids = item ? JSON.parse(item) : [];
            setSavedPostIds(new Set(ids));
            console.log('✅ Loaded', ids.length, 'saved posts from localStorage (fallback)');
          }
        } else {
          // Fall back to localStorage if not authenticated
          const item = window.localStorage.getItem(SAVED_POSTS_KEY);
          const ids = item ? JSON.parse(item) : [];
          setSavedPostIds(new Set(ids));
          console.log('✅ Loaded', ids.length, 'saved posts from localStorage');
        }
      } catch (error) {
        console.error("Error loading saved posts:", error);
        setSavedPostIds(new Set());
      } finally {
        setLoading(false);
      }
    }

    loadSavedPosts();
  }, [user?.id]);

  /**
   * Toggles the saved state of a post ID.
   * Uses database for authenticated users, localStorage for guests.
   */
  const toggleSave = useCallback(async (postId: string) => {
    console.log('🔖 Toggle save called for post:', postId);
    
    if (user?.id) {
      // Try database for authenticated users
      try {
        const result = await toggleSaveInDB(postId, user.id);
        
        setSavedPostIds(prevIds => {
          const newIds = new Set(prevIds);
          
          if (result.isSaved) {
            newIds.add(postId);
            console.log('✅ Added to saved (database):', postId);
          } else {
            newIds.delete(postId);
            console.log('❌ Removed from saved (database):', postId);
          }
          
          return newIds;
        });
      } catch (error) {
        console.warn('⚠️ Database save failed, using localStorage fallback:', error);
        // Fall back to localStorage if database fails
        setSavedPostIds(prevIds => {
          const newIds = new Set(prevIds);
          const wasSaved = newIds.has(postId);
          
          if (wasSaved) {
            newIds.delete(postId);
            console.log('❌ Removed from saved (localStorage fallback):', postId);
          } else {
            newIds.add(postId);
            console.log('✅ Added to saved (localStorage fallback):', postId);
          }
          
          try {
            const idsArray = Array.from(newIds);
            window.localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(idsArray));
          } catch (storageError) {
            console.error("Error saving to localStorage", storageError);
          }

          return newIds;
        });
      }
    } else {
      // Use localStorage for guests
      setSavedPostIds(prevIds => {
        const newIds = new Set(prevIds);
        const wasSaved = newIds.has(postId);
        
        if (wasSaved) {
          newIds.delete(postId);
          console.log('❌ Removed from saved (localStorage):', postId);
        } else {
          newIds.add(postId);
          console.log('✅ Added to saved (localStorage):', postId);
        }
        
        try {
          const idsArray = Array.from(newIds);
          window.localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(idsArray));
          console.log('💾 Saved to localStorage. Total saved posts:', idsArray.length);
        } catch (error) {
          console.error("Error saving posts to localStorage", error);
        }

        return newIds;
      });
    }
  }, [user?.id]);

  /**
   * Checks if a given post ID is in the saved set.
   */
  const isSaved = useCallback((postId: string) => savedPostIds.has(postId), [savedPostIds]);

  return { isSaved, toggleSave, loading };
}
