/**
 * Smart Filters Hook
 * Dynamically generates filter options from actual post data
 */

import { useMemo } from 'react';
import type { Post } from '../types';

export interface TagStats {
  tag: string;
  count: number;
  category?: string;
}

export function useSmartFilters(posts: Post[]) {
  /**
   * Extract all unique tags from posts with usage counts
   */
  const tagStats = useMemo(() => {
    const tagMap = new Map<string, number>();
    
    posts.forEach(post => {
      post.tags?.forEach(tag => {
        const normalizedTag = tag.toLowerCase().trim();
        tagMap.set(normalizedTag, (tagMap.get(normalizedTag) || 0) + 1);
      });
    });

    // Convert to array and sort by popularity
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  /**
   * Get popular tags (top N)
   */
  const getPopularTags = (limit: number = 10): TagStats[] => {
    return tagStats.slice(0, limit);
  };

  /**
   * Get tags by category/post type
   */
  const getTagsByPostType = (postType: string): TagStats[] => {
    const typeTagMap = new Map<string, number>();
    
    posts
      .filter(post => post.postType === postType)
      .forEach(post => {
        post.tags?.forEach(tag => {
          const normalizedTag = tag.toLowerCase().trim();
          typeTagMap.set(normalizedTag, (typeTagMap.get(normalizedTag) || 0) + 1);
        });
      });

    return Array.from(typeTagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  };

  /**
   * Get all unique categories from posts
   */
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    posts.forEach(post => {
      const category = post.postType || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  /**
   * Get all unique locations from posts
   */
  const locations = useMemo(() => {
    const locationMap = new Map<string, number>();
    
    posts.forEach(post => {
      if (post.location) {
        const normalizedLocation = post.location.trim();
        locationMap.set(normalizedLocation, (locationMap.get(normalizedLocation) || 0) + 1);
      }
    });

    return Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  /**
   * Filter posts by tag
   */
  const filterByTag = (tag: string): Post[] => {
    const normalizedTag = tag.toLowerCase().trim();
    return posts.filter(post => 
      post.tags?.some(t => t.toLowerCase().trim() === normalizedTag)
    );
  };

  /**
   * Filter posts by multiple tags (AND logic)
   */
  const filterByTags = (tags: string[]): Post[] => {
    const normalizedTags = tags.map(t => t.toLowerCase().trim());
    return posts.filter(post =>
      normalizedTags.every(tag =>
        post.tags?.some(t => t.toLowerCase().trim() === tag)
      )
    );
  };

  /**
   * Filter posts by any tag (OR logic)
   */
  const filterByAnyTag = (tags: string[]): Post[] => {
    const normalizedTags = tags.map(t => t.toLowerCase().trim());
    return posts.filter(post =>
      post.tags?.some(t => normalizedTags.includes(t.toLowerCase().trim()))
    );
  };

  /**
   * Get related tags (tags that often appear together with given tag)
   */
  const getRelatedTags = (tag: string, limit: number = 5): TagStats[] => {
    const normalizedTag = tag.toLowerCase().trim();
    const relatedTagMap = new Map<string, number>();
    
    // Find posts with this tag
    const postsWithTag = posts.filter(post =>
      post.tags?.some(t => t.toLowerCase().trim() === normalizedTag)
    );

    // Count co-occurring tags
    postsWithTag.forEach(post => {
      post.tags?.forEach(t => {
        const otherTag = t.toLowerCase().trim();
        if (otherTag !== normalizedTag) {
          relatedTagMap.set(otherTag, (relatedTagMap.get(otherTag) || 0) + 1);
        }
      });
    });

    return Array.from(relatedTagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  /**
   * Search tags by query
   */
  const searchTags = (query: string): TagStats[] => {
    const normalizedQuery = query.toLowerCase().trim();
    return tagStats.filter(({ tag }) =>
      tag.toLowerCase().includes(normalizedQuery)
    );
  };

  return {
    tagStats,
    getPopularTags,
    getTagsByPostType,
    categories,
    locations,
    filterByTag,
    filterByTags,
    filterByAnyTag,
    getRelatedTags,
    searchTags
  };
}

