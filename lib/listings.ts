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
      .select('*')
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
      category: 'General', // Default category since we don't have this field
      price: 'Price on request', // Default since we don't have this field
      image_url: undefined, // Will be added later
      user_id: post.user_id,
      created_at: post.created_at
    }))
  },

  // Get listings by category (simplified since we don't have category field yet)
  async getListingsByCategory(category: string): Promise<Listing[]> {
    // For now, return all listings since we don't have category field
    return this.getAllListings()
  },

  // Search listings
  async searchListings(searchTerm: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
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
      category: 'General',
      price: 'Price on request',
      image_url: undefined,
      user_id: post.user_id,
      created_at: post.created_at
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
      category: 'General',
      price: 'Price on request',
      image_url: undefined,
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
      category: 'General',
      price: 'Price on request',
      image_url: undefined,
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
      category: 'General',
      price: 'Price on request',
      image_url: undefined,
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
