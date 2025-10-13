import { supabase } from '@/lib/supabase';
import { DefaultFolderData } from '@/components/FolderCard';

export interface DefaultFolderConfig extends DefaultFolderData {
  key: string;
  position: number;
}

// Get user's customization for default folders from database
export class DefaultFoldersService {
  /**
   * Get or create default folder customizations for a user
   */
  static async getDefaultFolderCustomizations(userId: string): Promise<{
    [key: string]: DefaultFolderData;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_folders')
        .select('*')
        .eq('user_id', userId)
        .eq('folder_type', 'default');

      if (error) throw error;

      // Convert array to object keyed by category
      const customizations: { [key: string]: DefaultFolderData } = {};
      
      data?.forEach((folder: any) => {
        customizations[folder.category] = {
          id: folder.id,
          title: folder.title,
          description: folder.description,
          color: folder.color,
          custom_color: folder.custom_color,
          color_type: folder.color_type,
          image_url: folder.image_url,
          icon: folder.icon
        };
      });

      return customizations;
    } catch (error) {
      console.error('Error fetching default folder customizations:', error);
      return {};
    }
  }

  /**
   * Save customization for a default folder
   */
  static async saveDefaultFolderCustomization(
    userId: string,
    folderKey: string,
    customization: Partial<DefaultFolderData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if customization exists
      const { data: existing } = await supabase
        .from('user_folders')
        .select('id')
        .eq('user_id', userId)
        .eq('category', folderKey)
        .eq('folder_type', 'default')
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_folders')
          .update(customization)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const defaultFolder = DEFAULT_FOLDERS.find(f => f.key === folderKey);
        if (!defaultFolder) throw new Error('Invalid folder key');

        const { error } = await supabase
          .from('user_folders')
          .insert({
            user_id: userId,
            title: customization.title || defaultFolder.title,
            description: customization.description,
            color: customization.color || defaultFolder.color,
            custom_color: customization.custom_color,
            color_type: customization.color_type || 'preset',
            image_url: customization.image_url,
            icon: customization.icon || defaultFolder.icon,
            category: folderKey,
            folder_type: 'default',
            position: defaultFolder.position,
            is_public: false
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving folder customization:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save customization'
      };
    }
  }
}

// Default folder configurations (fallback values)
export const DEFAULT_FOLDERS: DefaultFolderConfig[] = [
  {
    id: 'default-posts',
    key: 'posts',
    title: 'My Posts',
    description: 'Your posts and updates',
    color: 'blue',
    icon: 'Upload',
    position: 0
  },
  {
    id: 'default-inbox',
    key: 'inbox',
    title: 'Inbox',
    description: 'Encrypted messages',
    color: 'indigo',
    icon: 'Mail',
    position: 1
  },
  {
    id: 'default-saved',
    key: 'saved',
    title: 'Saved',
    description: 'Bookmarked content',
    color: 'pink',
    icon: 'Heart',
    position: 2
  },
  {
    id: 'default-groups',
    key: 'groups',
    title: 'Groups',
    description: 'Communities you\'re in',
    color: 'purple',
    icon: 'Users',
    position: 3
  },
  {
    id: 'default-portfolio',
    key: 'portfolio',
    title: 'Portfolio',
    description: 'Your work & files',
    color: 'green',
    icon: 'FileText',
    position: 4
  }
];

/**
 * Merge default folders with user customizations
 */
export function mergeDefaultFolders(
  customizations: { [key: string]: DefaultFolderData }
): DefaultFolderConfig[] {
  return DEFAULT_FOLDERS.map(defaultFolder => {
    const customization = customizations[defaultFolder.key];
    
    if (customization) {
      return {
        ...defaultFolder,
        ...customization,
        key: defaultFolder.key, // Preserve key
        position: defaultFolder.position // Preserve position
      };
    }
    
    return defaultFolder;
  });
}

