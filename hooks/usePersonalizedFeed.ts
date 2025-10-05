import { useState, useEffect, useMemo } from 'react';
import type { Post } from '../types';
import { useSavedPosts } from './useSavedListings';
import { usePosts } from '../contexts/PostsContext';

const SEARCH_HISTORY_KEY = 'panSearchHistory';
const MAX_HISTORY_ITEMS = 3;

// Helper function to get saved search history from localStorage
const getSearchHistory = (): string[] => {
  try {
    const history = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error retrieving search history from localStorage:", error);
    return [];
  }
};

// Helper function to set search history in localStorage
const setSearchHistory = (history: string[]) => {
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving search history to localStorage:", error);
  }
};

export function usePersonalizedFeed() {
  const { posts } = usePosts();
  const [history, setHistory] = useState<string[]>(getSearchHistory);
  const { isSaved } = useSavedPosts();
  const savedPosts = useMemo(() => posts.filter(p => isSaved(p.id)), [isSaved, posts]);

  useEffect(() => {
    setSearchHistory(history);
  }, [history]);

  const recordSearch = (term: string) => {
    setHistory(prevHistory => {
      // Remove term if it already exists to move it to the front
      const newHistory = prevHistory.filter(t => t.toLowerCase() !== term.toLowerCase());
      // Add new term to the beginning
      newHistory.unshift(term);
      // Ensure history doesn't exceed the max size
      return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearSearchHistory = () => {
    setHistory([]);
    try {
      window.localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing search history from localStorage:", error);
    }
  };
  
  const recommendedPosts = useMemo(() => {
    if (savedPosts.length === 0 && history.length === 0) {
      // Return a default-sorted list if no personalization data exists
      return [...posts].sort((a, b) => b.likes - a.likes);
    }

    const savedTags = new Set<string>();
    savedPosts.forEach(post => {
      post.tags?.forEach(tag => savedTags.add(tag.toLowerCase()));
    });

    const postScores = new Map<string, number>();

    posts.forEach(post => {
      let score = 0;

      // Score based on matching tags from saved posts
      if (post.tags) {
        post.tags.forEach(tag => {
          if (savedTags.has(tag.toLowerCase())) {
            score += 10;
          }
        });
      }

      // Score based on matching keywords from search history
      history.forEach((term, index) => {
        const lowercasedTerm = term.toLowerCase();
        let termScore = 0;
        if (post.title?.toLowerCase().includes(lowercasedTerm)) {
          termScore += 5;
        }
        if (post.content.toLowerCase().includes(lowercasedTerm)) {
          termScore += 3;
        }
        // Give more weight to more recent searches
        if (termScore > 0) {
            score += termScore * (MAX_HISTORY_ITEMS - index);
        }
      });
      
      // Give a small boost to saved items themselves
      if (isSaved(post.id)) {
        score += 2;
      }
      
      // Add base score from likes to differentiate unscored items
      score += post.likes / 100;

      postScores.set(post.id, score);
    });

    const sortedPosts = [...posts].sort((a, b) => {
      const scoreA = postScores.get(a.id) || 0;
      const scoreB = postScores.get(b.id) || 0;
      return scoreB - scoreA;
    });

    return sortedPosts;
  }, [savedPosts, history, isSaved, posts]);


  return { recommendedPosts, searchHistory: history, recordSearch, clearSearchHistory };
}