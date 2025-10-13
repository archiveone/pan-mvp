import { supabase, Listing } from './supabase'

export interface CreateListingData {
  title: string
  content?: string
  location?: string
  user_id: string
}

export interface UpdateListingData {
  title?: string
  content?: string
  location?: string
}

export const listingsService = {
  // Get all listings (using posts table)
  async getAllListings(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          name,
          username,
          avatar_url
        )
      `)
      // .eq('is_safety_approved', true) // Commented out until migration is run
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
      return []
    }

    // Transform posts to listings format
    return (data || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      location: post.location || 'Location not specified',
      category: post.category || 'General',
      price: post.price || post.price_amount ? `${post.price_amount} ${post.currency || 'USD'}` : 'Price on request',
      image_url: post.media_url,
      user_id: post.user_id,
      created_at: post.created_at,
      profiles: {
        username: post.profiles?.username || post.profiles?.name || 'Unknown User',
        avatar_url: post.profiles?.avatar_url || ''
      }
    }))
  },

  // Get listings by category
  async getListingsByCategory(category: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('category', category)
      // .eq('is_safety_approved', true) // Commented out until migration is run
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings by category:', error)
      return []
    }

    // Transform posts to listings format
    return (data || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      location: post.location || 'Location not specified',
      category: post.category || 'General',
      price: post.price || post.price_amount ? `${post.price_amount} ${post.currency || 'USD'}` : 'Price on request',
      image_url: post.media_url,
      user_id: post.user_id,
      created_at: post.created_at,
      profiles: {
        username: post.profiles?.username || post.profiles?.name || 'Unknown User',
        avatar_url: post.profiles?.avatar_url || ''
      }
    }))
  },

  // Search listings
  async searchListings(searchTerm: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      // .eq('is_safety_approved', true) // Commented out until migration is run
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching listings:', error)
      return []
    }

    // Transform posts to listings format
    return (data || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      location: post.location || 'Location not specified',
      category: post.category || 'General',
      price: post.price || post.price_amount ? `${post.price_amount} ${post.currency || 'USD'}` : 'Price on request',
      image_url: post.media_url,
      user_id: post.user_id,
      created_at: post.created_at,
      profiles: {
        username: post.profiles?.username || post.profiles?.name || 'Unknown User',
        avatar_url: post.profiles?.avatar_url || ''
      }
    }))
  },

  // Get user's listings
  async getUserListings(userId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user listings:', error)
      return []
    }

    // Transform posts to listings format
    return (data || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      location: post.location || 'Location not specified',
      category: post.category || 'General',
      price: post.price || post.price_amount ? `${post.price_amount} ${post.currency || 'USD'}` : 'Price on request',
      image_url: post.media_url,
      user_id: post.user_id,
      created_at: post.created_at
    }))
  },

  // Create a new listing (using posts table)
  async createListing(listingData: CreateListingData): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('posts')
      .insert([listingData])
      .select()
      .single()

    if (error) {
      console.error('Error creating listing:', error)
      return null
    }

    // Transform post to listing format
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      location: data.location || 'Location not specified',
      category: post.category || 'General',
      price: post.price || post.price_amount ? `${post.price_amount} ${post.currency || 'USD'}` : 'Price on request',
      image_url: post.media_url,
      user_id: data.user_id,
      created_at: data.created_at
    }
  },

  // Update a listing
  async updateListing(id: string, updates: UpdateListingData): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating listing:', error)
      return null
    }

    // Transform post to listing format
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      location: data.location || 'Location not specified',
      category: post.category || 'General',
      price: post.price || post.price_amount ? `${post.price_amount} ${post.currency || 'USD'}` : 'Price on request',
      image_url: post.media_url,
      user_id: data.user_id,
      created_at: data.created_at
    }
  },

  // Delete a listing
  async deleteListing(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting listing:', error)
      return false
    }

    return true
  }
}
