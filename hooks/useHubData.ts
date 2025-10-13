import { useState, useEffect, useCallback } from 'react';
import { 
  getUserPosts, 
  getSavedPosts, 
  getUserGroups, 
  getPortfolioFiles 
} from '@/services/userHubService';
import { MessagingService, Conversation } from '@/services/messagingService';
import { FoldersService, UserFolder } from '@/services/foldersService';
import { DefaultFoldersService } from '@/services/defaultFoldersService';

export interface HubData {
  posts: any[];
  saved: any[];
  groups: any[];
  portfolio: any[];
  conversations: Conversation[];
  customFolders: UserFolder[];
  defaultCustomizations: Record<string, any>;
  loading: boolean;
  error: string | null;
}

export function useHubData(userId: string | undefined) {
  const [data, setData] = useState<HubData>({
    posts: [],
    saved: [],
    groups: [],
    portfolio: [],
    conversations: [],
    customFolders: [],
    defaultCustomizations: {},
    loading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    if (!userId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load all data in parallel for better performance
      const [
        postsResult,
        savedResult,
        groupsResult,
        portfolioResult,
        conversationsData,
        foldersResult,
        defaultCustomizations
      ] = await Promise.all([
        getUserPosts(userId),
        getSavedPosts(userId),
        getUserGroups(userId),
        getPortfolioFiles(userId),
        MessagingService.getUserConversations().catch(() => []),
        FoldersService.getUserFolders(userId),
        DefaultFoldersService.getDefaultFolderCustomizations(userId)
      ]);

      setData({
        posts: postsResult.success ? postsResult.data || [] : [],
        saved: savedResult.success ? savedResult.data || [] : [],
        groups: groupsResult.success ? groupsResult.data || [] : [],
        portfolio: portfolioResult.success ? portfolioResult.data || [] : [],
        conversations: Array.isArray(conversationsData) ? conversationsData.slice(0, 3) : [],
        customFolders: foldersResult.success ? foldersResult.data || [] : [],
        defaultCustomizations,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading hub data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { ...data, reload: loadData };
}

// Helper to get folder data with customization applied
export function getFolderDisplay(
  key: string,
  defaultData: any,
  customizations: Record<string, any>
) {
  const custom = customizations[key];
  
  return {
    title: custom?.title || defaultData.title,
    color: custom?.color || defaultData.color,
    customColor: custom?.custom_color,
    colorType: custom?.color_type || 'preset',
    imageUrl: custom?.image_url,
    icon: custom?.icon || defaultData.icon,
    description: custom?.description || defaultData.description
  };
}

