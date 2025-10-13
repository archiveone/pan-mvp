import { supabase } from '@/lib/supabase';

export interface UserFolder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  color: string;
  custom_color?: string; // Hex color like #FF5733
  color_type?: 'preset' | 'custom';
  image_url?: string;
  icon?: string;
  category: 'people' | 'art' | 'listings' | 'work' | 'saved' | 'posts' | 'custom';
  folder_type: string;
  position: number;
  is_public: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface FolderItem {
  id: string;
  folder_id: string;
  item_type: 'post' | 'user' | 'listing' | 'file' | 'custom';
  item_id: string;
  added_at: string;
  notes?: string;
}

export interface CreateFolderData {
  title: string;
  description?: string;
  color: string;
  custom_color?: string;
  color_type?: 'preset' | 'custom';
  image_url?: string;
  icon?: string;
  category: string;
  folder_type?: string;
  position?: number;
  is_public?: boolean;
  settings?: Record<string, any>;
}

export class FoldersService {
  /**
   * Get all folders for a user
   */
  static async getUserFolders(userId: string): Promise<{
    success: boolean;
    data?: UserFolder[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_folders')
        .select(`
          *,
          item_count:folder_items(count)
        `)
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;

      // Transform the count result
      const folders = (data || []).map((folder: any) => ({
        ...folder,
        item_count: folder.item_count?.[0]?.count || 0
      }));

      return { success: true, data: folders };
    } catch (error) {
      console.error('Error fetching user folders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch folders'
      };
    }
  }

  /**
   * Create a new folder
   */
  static async createFolder(
    userId: string,
    folderData: CreateFolderData
  ): Promise<{
    success: boolean;
    data?: UserFolder;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_folders')
        .insert({
          user_id: userId,
          title: folderData.title,
          description: folderData.description,
          color: folderData.color,
          custom_color: folderData.custom_color,
          color_type: folderData.color_type || 'preset',
          image_url: folderData.image_url,
          icon: folderData.icon,
          category: folderData.category,
          folder_type: folderData.folder_type || 'custom',
          position: folderData.position || 0,
          is_public: folderData.is_public || false,
          settings: folderData.settings || {}
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create folder'
      };
    }
  }

  /**
   * Update a folder
   */
  static async updateFolder(
    folderId: string,
    updates: Partial<CreateFolderData>
  ): Promise<{
    success: boolean;
    data?: UserFolder;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_folders')
        .update(updates)
        .eq('id', folderId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update folder'
      };
    }
  }

  /**
   * Delete a folder
   */
  static async deleteFolder(folderId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('user_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete folder'
      };
    }
  }

  /**
   * Add item to folder
   */
  static async addItemToFolder(
    folderId: string,
    itemType: string,
    itemId: string,
    notes?: string
  ): Promise<{
    success: boolean;
    data?: FolderItem;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('folder_items')
        .insert({
          folder_id: folderId,
          item_type: itemType,
          item_id: itemId,
          notes
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Item already exists in this folder'
          };
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error adding item to folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add item'
      };
    }
  }

  /**
   * Remove item from folder
   */
  static async removeItemFromFolder(
    folderId: string,
    itemType: string,
    itemId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('folder_items')
        .delete()
        .eq('folder_id', folderId)
        .eq('item_type', itemType)
        .eq('item_id', itemId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing item from folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove item'
      };
    }
  }

  /**
   * Get items in a folder
   */
  static async getFolderItems(folderId: string): Promise<{
    success: boolean;
    data?: FolderItem[];
    error?: string;
  }> {
    try {
      const { data, error} = await supabase
        .from('folder_items')
        .select('*')
        .eq('folder_id', folderId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching folder items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch items'
      };
    }
  }

  /**
   * Update folder positions (for drag-and-drop reordering)
   */
  static async updateFolderPositions(
    folderPositions: Array<{ id: string; position: number }>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const promises = folderPositions.map(({ id, position }) =>
        supabase
          .from('user_folders')
          .update({ position })
          .eq('id', id)
      );

      await Promise.all(promises);

      return { success: true };
    } catch (error) {
      console.error('Error updating folder positions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update positions'
      };
    }
  }
}

// Predefined color schemes
export const FOLDER_COLORS = {
  blue: { from: 'from-blue-500', to: 'to-cyan-500', name: 'Ocean Blue' },
  purple: { from: 'from-purple-500', to: 'to-violet-500', name: 'Royal Purple' },
  pink: { from: 'from-pink-500', to: 'to-rose-500', name: 'Sunset Pink' },
  green: { from: 'from-green-500', to: 'to-emerald-500', name: 'Forest Green' },
  orange: { from: 'from-orange-500', to: 'to-amber-500', name: 'Autumn Orange' },
  red: { from: 'from-red-500', to: 'to-pink-500', name: 'Cherry Red' },
  indigo: { from: 'from-indigo-500', to: 'to-purple-500', name: 'Deep Indigo' },
  teal: { from: 'from-teal-500', to: 'to-cyan-500', name: 'Tropical Teal' },
  lime: { from: 'from-lime-500', to: 'to-green-500', name: 'Fresh Lime' },
  amber: { from: 'from-amber-500', to: 'to-yellow-500', name: 'Golden Amber' },
  sky: { from: 'from-sky-500', to: 'to-blue-500', name: 'Sky Blue' },
  fuchsia: { from: 'from-fuchsia-500', to: 'to-pink-500', name: 'Vibrant Fuchsia' }
};

// Category options
export const FOLDER_CATEGORIES = [
  { value: 'people', label: 'People', icon: 'Users', description: 'Organize contacts and profiles' },
  { value: 'art', label: 'Art & Design', icon: 'Palette', description: 'Creative work and inspiration' },
  { value: 'listings', label: 'Listings', icon: 'ShoppingBag', description: 'Products and services' },
  { value: 'work', label: 'Work', icon: 'Briefcase', description: 'Professional projects' },
  { value: 'saved', label: 'Saved Items', icon: 'Bookmark', description: 'Bookmarked content' },
  { value: 'posts', label: 'Posts', icon: 'FileText', description: 'Your posts and updates' },
  { value: 'media', label: 'Media', icon: 'Image', description: 'Photos and videos' },
  { value: 'custom', label: 'Custom', icon: 'Folder', description: 'Create your own' }
];

