import { supabase } from '@/lib/supabase';

interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HubBox {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  box_type: 'posts' | 'saved' | 'inbox' | 'groups' | 'portfolio' | 'custom' | 'chat_group';
  instance_name?: string;
  color: string;
  custom_color?: string;
  color_type: 'preset' | 'custom';
  image_url?: string;
  icon: string;
  position: number;
  size: 'small' | 'normal' | 'large' | 'wide';
  is_active: boolean;
  is_deletable: boolean;
  is_public: boolean;
  view_mode: 'grid' | 'list' | 'compact';
  filters: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface CreateHubBoxData {
  title: string;
  description?: string;
  box_type: string;
  instance_name?: string;
  color?: string;
  custom_color?: string;
  color_type?: 'preset' | 'custom';
  image_url?: string;
  icon?: string;
  size?: string;
  is_public?: boolean;
  view_mode?: string;
  filters?: Record<string, any>;
}

export class AdvancedHubService {
  /**
   * Get all active hub boxes for a user
   */
  static async getUserHubBoxes(userId: string): Promise<{
    success: boolean;
    data?: HubBox[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('hub_boxes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching hub boxes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch boxes'
      };
    }
  }

  /**
   * Create a new hub box
   */
  static async createHubBox(
    userId: string,
    boxData: CreateHubBoxData
  ): Promise<{
    success: boolean;
    data?: HubBox;
    error?: string;
  }> {
    try {
      // Get max position for new box
      const { data: maxPos } = await supabase
        .from('hub_boxes')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const nextPosition = (maxPos?.position || -1) + 1;

      const { data, error } = await supabase
        .from('hub_boxes')
        .insert({
          user_id: userId,
          title: boxData.title,
          description: boxData.description,
          box_type: boxData.box_type,
          instance_name: boxData.instance_name,
          color: boxData.color || 'blue',
          custom_color: boxData.custom_color,
          color_type: boxData.color_type || 'preset',
          image_url: boxData.image_url,
          icon: boxData.icon || 'Folder',
          position: nextPosition,
          size: boxData.size || 'normal',
          view_mode: boxData.view_mode || 'grid',
          filters: boxData.filters || {},
          is_active: true,
          is_deletable: true
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating hub box:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create box'
      };
    }
  }

  /**
   * Update a hub box
   */
  static async updateHubBox(
    boxId: string,
    updates: Partial<CreateHubBoxData>
  ): Promise<{
    success: boolean;
    data?: HubBox;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('hub_boxes')
        .update(updates)
        .eq('id', boxId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating hub box:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update box'
      };
    }
  }

  /**
   * Delete a hub box
   */
  static async deleteHubBox(boxId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('hub_boxes')
        .delete()
        .eq('id', boxId)
        .eq('is_deletable', true);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting hub box:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete box'
      };
    }
  }

  /**
   * Reorder hub boxes (drag & drop)
   */
  static async reorderHubBoxes(
    boxPositions: Array<{ id: string; position: number }>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const promises = boxPositions.map(({ id, position }) =>
        supabase
          .from('hub_boxes')
          .update({ position })
          .eq('id', id)
      );

      await Promise.all(promises);

      return { success: true };
    } catch (error) {
      console.error('Error reordering boxes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder boxes'
      };
    }
  }

  /**
   * Toggle box visibility
   */
  static async toggleBoxVisibility(boxId: string, isActive: boolean): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('hub_boxes')
        .update({ is_active: isActive })
        .eq('id', boxId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle visibility'
      };
    }
  }

  /**
   * Initialize default boxes for new user
   */
  static async initializeDefaultBoxes(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data: existing } = await supabase
        .from('hub_boxes')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: true }; // Already initialized
      }

      // Create default boxes - Streamlined (only My Listings protected)
      const defaultBoxes = [
        { title: 'My Listings', box_type: 'posts', icon: 'Upload', color: 'blue', position: 0, is_deletable: false, is_public: true }, // Protected! Public profile
        { title: 'Dashboard', box_type: 'dashboard', icon: 'BarChart3', color: 'green', position: 1, is_deletable: true, is_public: false }, // Analytics dashboard
        { title: 'Messages', box_type: 'inbox', icon: 'Mail', color: 'indigo', position: 2, is_deletable: true, is_public: false }, // Can delete/duplicate
        { title: 'Saved', box_type: 'saved', icon: 'Heart', color: 'pink', position: 3, is_deletable: true, is_public: false } // Can delete
      ];

      const { error } = await supabase
        .from('hub_boxes')
        .insert(
          defaultBoxes.map(box => ({
            user_id: userId,
            ...box
          }))
        );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize boxes'
      };
    }
  }

  /**
   * Duplicate a box (create multiple instances)
   */
  static async duplicateBox(
    boxId: string,
    newInstanceName: string
  ): Promise<{
    success: boolean;
    data?: HubBox;
    error?: string;
  }> {
    try {
      // Get original box
      const { data: originalBox, error: fetchError } = await supabase
        .from('hub_boxes')
        .select('*')
        .eq('id', boxId)
        .single();

      if (fetchError) throw fetchError;

      // Get max position
      const { data: maxPos } = await supabase
        .from('hub_boxes')
        .select('position')
        .eq('user_id', originalBox.user_id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      // Create duplicate
      const { data: newBox, error: createError } = await supabase
        .from('hub_boxes')
        .insert({
          user_id: originalBox.user_id,
          title: newInstanceName,
          description: originalBox.description,
          box_type: originalBox.box_type,
          instance_name: newInstanceName,
          color: originalBox.color,
          custom_color: originalBox.custom_color,
          color_type: originalBox.color_type,
          image_url: originalBox.image_url,
          icon: originalBox.icon,
          position: (maxPos?.position || 0) + 1,
          size: originalBox.size,
          view_mode: originalBox.view_mode,
          filters: originalBox.filters,
          settings: originalBox.settings,
          is_active: true,
          is_deletable: true
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, data: newBox };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to duplicate box'
      };
    }
  }

  /**
   * Add a listing/post to a hub box
   */
  static async addItemToBox(boxId: string, itemId: string, itemType: 'post' | 'listing' = 'post'): Promise<ServiceResult<any>> {
    try {
      console.log('💾 Attempting to save:', { boxId, itemId, itemType });
      
      const { data, error } = await supabase
        .from('hub_box_items')
        .insert({
          box_id: boxId,
          item_id: itemId,
          item_type: itemType
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Successfully saved to database:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error adding item to box:', error);
      return { success: false, error: error.message || 'Failed to add item to box' };
    }
  }

  /**
   * Remove a listing/post from a hub box
   */
  static async removeItemFromBox(boxId: string, itemId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('hub_box_items')
        .delete()
        .eq('box_id', boxId)
        .eq('item_id', itemId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error removing item from box:', error);
      return { success: false, error: error.message || 'Failed to remove item from box' };
    }
  }

  /**
   * Get all items in a hub box
   */
  static async getBoxItems(boxId: string): Promise<ServiceResult<any[]>> {
    try {
      console.log('📦 Loading items for box:', boxId);
      
      // First, just get the box items
      const { data: boxItems, error: boxItemsError } = await supabase
        .from('hub_box_items')
        .select('*')
        .eq('box_id', boxId)
        .order('created_at', { ascending: false });

      if (boxItemsError) {
        console.error('❌ Error loading box items:', boxItemsError.message || boxItemsError);
        console.error('❌ Error details:', JSON.stringify(boxItemsError, null, 2));
        
        // Table might not exist yet
        if (boxItemsError.message?.includes('relation') || boxItemsError.code === '42P01') {
          console.warn('⚠️  hub_box_items table does not exist. Run migrations first!');
          return { success: true, data: [] }; // Return empty instead of error
        }
        
        throw boxItemsError;
      }

      console.log(`✅ Found ${boxItems?.length || 0} items in box`);

      if (!boxItems || boxItems.length === 0) {
        return { success: true, data: [] };
      }

      // Then, fetch the post/listing data for each item
      const itemsWithData = await Promise.all(
        boxItems.map(async (item) => {
          try {
            console.log(`🔍 Fetching post data for item: ${item.item_id}`);
            
            const { data: postData, error: postError } = await supabase
              .from('posts')
              .select('*')
              .eq('id', item.item_id)
              .maybeSingle();

            if (postError) {
              console.error('❌ Error fetching post:', postError.message, postError.code);
              return { ...item, posts: null };
            }

            if (!postData) {
              console.warn('⚠️  Post not found in database:', item.item_id);
              return { ...item, posts: null };
            }

            console.log('✅ Post data fetched:', { id: postData.id, title: postData.title });
            return { ...item, posts: postData };
          } catch (err: any) {
            console.error('❌ Exception loading post:', item.item_id, err.message);
            return { ...item, posts: null };
          }
        })
      );

      // Filter out items where post data couldn't be loaded
      const validItems = itemsWithData.filter(item => item.posts !== null);

      console.log(`✅ Loaded ${validItems.length} items with post data`);

      return { success: true, data: validItems };
    } catch (error: any) {
      console.error('❌ Error getting box items:', error?.message || error);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      return { success: true, error: error.message || 'Failed to get box items', data: [] }; // Return success with empty data
    }
  }

  /**
   * Check if an item is in a specific box
   */
  static async isItemInBox(boxId: string, itemId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('hub_box_items')
        .select('id')
        .eq('box_id', boxId)
        .eq('item_id', itemId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all boxes that contain a specific item
   */
  static async getBoxesForItem(userId: string, itemId: string): Promise<ServiceResult<HubBox[]>> {
    try {
      const { data, error } = await supabase
        .from('hub_box_items')
        .select(`
          box_id,
          hub_boxes!inner (
            *
          )
        `)
        .eq('item_id', itemId)
        .eq('hub_boxes.user_id', userId);

      if (error) throw error;

      const boxes = data?.map((item: any) => item.hub_boxes).filter(Boolean) || [];
      return { success: true, data: boxes };
    } catch (error: any) {
      console.error('Error getting boxes for item:', error);
      return { success: false, error: error.message || 'Failed to get boxes for item' };
    }
  }

  /**
   * Assign a conversation to an inbox box
   */
  static async assignConversationToInbox(boxId: string, conversationId: string, userId: string): Promise<ServiceResult<any>> {
    try {
      const { data, error } = await supabase
        .from('inbox_assignments')
        .insert({
          hub_box_id: boxId,
          conversation_id: conversationId,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to assign conversation' };
    }
  }

  /**
   * Remove conversation from inbox box
   */
  static async removeConversationFromInbox(boxId: string, conversationId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('inbox_assignments')
        .delete()
        .eq('hub_box_id', boxId)
        .eq('conversation_id', conversationId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to remove conversation' };
    }
  }

  /**
   * Get conversations for a specific inbox box
   */
  static async getInboxConversations(boxId: string): Promise<ServiceResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from('inbox_assignments')
        .select('conversation_id')
        .eq('hub_box_id', boxId);

      if (error) throw error;
      
      const conversationIds = data?.map(item => item.conversation_id) || [];
      return { success: true, data: conversationIds };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get inbox conversations' };
    }
  }
}

// Box type configurations
export const BOX_TYPES = [
  { value: 'posts', label: 'Posts', icon: 'Upload', description: 'Your posts and updates', allowMultiple: true },
  { value: 'saved', label: 'Saved', icon: 'Heart', description: 'Bookmarked items', allowMultiple: true },
  { value: 'inbox', label: 'Inbox', icon: 'Mail', description: 'Messages and chats', allowMultiple: true },
  { value: 'groups', label: 'Groups', icon: 'Users', description: 'Communities', allowMultiple: true },
  { value: 'portfolio', label: 'Portfolio', icon: 'FileText', description: 'Your work files', allowMultiple: true },
  { value: 'custom', label: 'Custom', icon: 'Folder', description: 'Custom collection', allowMultiple: true }
];

// Size options
export const BOX_SIZES = [
  { value: 'small', label: 'Small', cols: 1 },
  { value: 'normal', label: 'Normal', cols: 1 },
  { value: 'large', label: 'Large', cols: 1 },
  { value: 'wide', label: 'Wide', cols: 2 }
];

// View modes
export const VIEW_MODES = [
  { value: 'grid', label: 'Grid', icon: 'Grid' },
  { value: 'list', label: 'List', icon: 'List' },
  { value: 'compact', label: 'Compact', icon: 'LayoutGrid' }
];

