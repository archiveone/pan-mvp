/**
 * Saved Folders Service
 * Handles folder organization for saved listings
 */

import { supabase } from '@/lib/supabase'

export interface SavedFolder {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  position: number
  created_at: string
  updated_at: string
  item_count?: number
}

export interface SavedItem {
  id: string
  user_id: string
  post_id: string
  folder_id: string | null
  created_at: string
  post?: any
}

export class SavedFoldersService {
  /**
   * Get all folders for current user
   */
  static async getFolders(): Promise<{ success: boolean; folders: SavedFolder[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, folders: [], error: 'Not authenticated' }
      }

      const { data, error } = await supabase
        .from('saved_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })

      if (error) {
        // If table doesn't exist yet, return empty array gracefully and silently
        if (error.code === '42P01' || 
            error.message?.includes('does not exist') || 
            error.message?.includes('schema cache')) {
          return { success: true, folders: [] }
        }
        console.warn('Error fetching folders:', error)
        return { success: false, folders: [], error: error.message }
      }

      // Get item counts for each folder
      const foldersWithCounts = await Promise.all(
        (data || []).map(async (folder) => {
          const { count } = await supabase
            .from('saved_items')
            .select('*', { count: 'exact', head: true })
            .eq('folder_id', folder.id)

          return { ...folder, item_count: count || 0 }
        })
      )

      return { success: true, folders: foldersWithCounts }
    } catch (error: any) {
      console.error('Unexpected error fetching folders:', error)
      return { success: false, folders: [], error: error.message }
    }
  }

  /**
   * Create a new folder
   */
  static async createFolder(name: string, color = '#84cc16', icon = '📁'): Promise<{
    success: boolean
    folder?: SavedFolder
    error?: string
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      // Get current max position
      const { data: folders } = await supabase
        .from('saved_folders')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = folders && folders.length > 0 ? folders[0].position + 1 : 0

      const { data, error } = await supabase
        .from('saved_folders')
        .insert({
          user_id: user.id,
          name,
          color,
          icon,
          position: nextPosition
        })
        .select()
        .single()

      if (error) {
        // If table doesn't exist yet, provide helpful message
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          return { 
            success: false, 
            error: 'Please run the database migration first. See SAVED-FOLDERS-SETUP.md for instructions.' 
          }
        }
        console.error('Error creating folder:', error)
        return { success: false, error: error.message }
      }

      return { success: true, folder: data }
    } catch (error: any) {
      console.error('Unexpected error creating folder:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update a folder
   */
  static async updateFolder(folderId: string, updates: Partial<SavedFolder>): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('saved_folders')
        .update(updates)
        .eq('id', folderId)

      if (error) {
        console.error('Error updating folder:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Unexpected error updating folder:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a folder
   */
  static async deleteFolder(folderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Items will be set to null folder_id (cascade)
      const { error } = await supabase
        .from('saved_folders')
        .delete()
        .eq('id', folderId)

      if (error) {
        console.error('Error deleting folder:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Unexpected error deleting folder:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get saved items in a folder
   */
  static async getFolderItems(folderId: string | null): Promise<{
    success: boolean
    items: SavedItem[]
    error?: string
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, items: [], error: 'Not authenticated' }
      }

      let query = supabase
        .from('saved_items')
        .select(`
          *,
          post:posts (
            *,
            profiles!posts_user_id_fkey (
              id,
              name,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (folderId === null) {
        query = query.is('folder_id', null)
      } else {
        query = query.eq('folder_id', folderId)
      }

      const { data, error } = await query

      if (error) {
        // If table doesn't exist yet, return empty array gracefully
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Saved items table does not exist yet. Run migration to enable folder features.')
          return { success: true, items: [] }
        }
        console.error('Error fetching folder items:', error)
        return { success: false, items: [], error: error.message }
      }

      return { success: true, items: data || [] }
    } catch (error: any) {
      console.error('Unexpected error fetching folder items:', error)
      return { success: false, items: [], error: error.message }
    }
  }

  /**
   * Save a post to a folder
   */
  static async savePost(postId: string, folderId: string | null = null): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { error } = await supabase
        .from('saved_items')
        .insert({
          user_id: user.id,
          post_id: postId,
          folder_id: folderId
        })

      if (error) {
        console.error('Error saving post:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Unexpected error saving post:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Unsave a post
   */
  static async unsavePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (error) {
        console.error('Error unsaving post:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Unexpected error unsaving post:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Move item to a different folder
   */
  static async moveToFolder(postId: string, folderId: string | null): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { error } = await supabase
        .from('saved_items')
        .update({ folder_id: folderId })
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (error) {
        console.error('Error moving item:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Unexpected error moving item:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check if a post is saved
   */
  static async isPostSaved(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking if post is saved:', error)
      }

      return !!data
    } catch (error) {
      console.error('Unexpected error checking if post is saved:', error)
      return false
    }
  }

  /**
   * Get all saved items (across all folders)
   */
  static async getAllSavedItems(): Promise<{
    success: boolean
    items: SavedItem[]
    error?: string
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, items: [], error: 'Not authenticated' }
      }

      const { data, error } = await supabase
        .from('saved_items')
        .select(`
          *,
          post:posts (
            *,
            profiles!posts_user_id_fkey (
              id,
              name,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all saved items:', error)
        return { success: false, items: [], error: error.message }
      }

      return { success: true, items: data || [] }
    } catch (error: any) {
      console.error('Unexpected error fetching all saved items:', error)
      return { success: false, items: [], error: error.message }
    }
  }
}

