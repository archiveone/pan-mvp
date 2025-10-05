import { useState, useEffect, useCallback } from 'react';

const SAVED_POSTS_KEY = 'savedPosts';

/**
 * Custom hook to manage saved posts using localStorage.
 * @returns An object with a function to check if a post is saved
 * and a function to toggle the save state.
 */
export function useSavedPosts() {
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  // On initial mount, load saved posts from localStorage.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(SAVED_POSTS_KEY);
      const ids = item ? JSON.parse(item) : [];
      setSavedPostIds(new Set(ids));
    } catch (error)
      {
      console.error("Error reading saved posts from localStorage", error);
      setSavedPostIds(new Set()); // Reset to empty on error
    }
  }, []);

  /**
   * Toggles the saved state of a post ID.
   * Updates both the component state and localStorage.
   */
  const toggleSave = useCallback((postId: string) => {
    setSavedPostIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(postId)) {
        newIds.delete(postId);
      } else {
        newIds.add(postId);
      }
      
      try {
        // Persist the new set to localStorage.
        window.localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(Array.from(newIds)));
      } catch (error) {
        console.error("Error saving posts to localStorage", error);
      }

      return newIds;
    });
  }, []);

  /**
   * Checks if a given post ID is in the saved set.
   */
  const isSaved = useCallback((postId: string) => savedPostIds.has(postId), [savedPostIds]);

  return { isSaved, toggleSave };
}