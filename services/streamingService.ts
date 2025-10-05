// Comprehensive Streaming Service
// Handles music, videos, podcasts, live streaming, and ticketing

import { supabase } from '@/lib/supabase'

export interface StreamingContent {
  id: string
  postId: string
  contentType: 'music' | 'video' | 'podcast' | 'live_stream' | 'audiobook'
  title: string
  description?: string
  duration?: number
  fileSize?: number
  fileUrl: string
  thumbnailUrl?: string
  quality: string
  bitrate?: number
  resolution?: string
  format: string
  isLive: boolean
  isPremium: boolean
  isDownloadable: boolean
  downloadLimit: number
  streamCount: number
  downloadCount: number
}

export interface MusicContent extends StreamingContent {
  artistName: string
  albumName?: string
  trackNumber?: number
  genre?: string
  releaseDate?: string
  label?: string
  isrc?: string
  bpm?: number
  keySignature?: string
  mood?: string
  language?: string
  explicit: boolean
}

export interface PodcastContent extends StreamingContent {
  podcastName: string
  episodeNumber?: number
  seasonNumber?: number
  hostName?: string
  guestName?: string
  topic?: string
  category?: string
  language?: string
  transcript?: string
  showNotes?: string
  chapterMarkers?: any[]
}

export interface VideoContent extends StreamingContent {
  director?: string
  producer?: string
  cast?: string[]
  genre?: string
  rating?: string
  releaseDate?: string
  durationMinutes?: number
  language?: string
  subtitlesAvailable: boolean
  subtitlesLanguages?: string[]
}

export interface Event {
  id: string
  postId: string
  eventName: string
  description?: string
  eventType: 'gig' | 'festival' | 'concert' | 'workshop' | 'conference' | 'meetup'
  venueName?: string
  venueAddress?: string
  venueCapacity?: number
  startDate: string
  endDate: string
  timezone: string
  isVirtual: boolean
  virtualUrl?: string
  organizerName?: string
  organizerContact?: string
  ageRestriction?: string
  dressCode?: string
  cancellationPolicy?: string
  refundPolicy?: string
}

export interface EventTicket {
  id: string
  eventId: string
  ticketName: string
  description?: string
  price: number
  currency: string
  quantityAvailable: number
  quantitySold: number
  maxPerPerson: number
  saleStartDate?: string
  saleEndDate?: string
  isTransferable: boolean
  isRefundable: boolean
  refundDeadline?: string
  isActive: boolean
}

export interface TicketPurchase {
  id: string
  eventId: string
  ticketId: string
  buyerId: string
  quantity: number
  totalPrice: number
  currency: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  paymentMethod?: string
  paymentReference?: string
  qrCode?: string
  checkInTime?: string
  isCheckedIn: boolean
}

class StreamingService {
  // Upload streaming content
  async uploadContent(
    postId: string,
    contentType: string,
    title: string,
    description: string,
    fileUrl: string,
    thumbnailUrl?: string,
    metadata?: any
  ): Promise<{ success: boolean; contentId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('streaming_content')
        .insert({
          post_id: postId,
          content_type: contentType,
          title,
          description,
          file_url: fileUrl,
          thumbnail_url: thumbnailUrl,
          ...metadata
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, contentId: data.id }
    } catch (error) {
      console.error('Error uploading content:', error)
      return { success: false, error: error.message }
    }
  }

  // Upload music content
  async uploadMusic(
    postId: string,
    title: string,
    artistName: string,
    fileUrl: string,
    metadata: {
      albumName?: string
      genre?: string
      releaseDate?: string
      label?: string
      isrc?: string
      bpm?: number
      keySignature?: string
      mood?: string
      language?: string
      explicit?: boolean
    }
  ): Promise<{ success: boolean; contentId?: string; error?: string }> {
    try {
      // Create streaming content
      const { data: streamingContent, error: streamingError } = await supabase
        .from('streaming_content')
        .insert({
          post_id: postId,
          content_type: 'music',
          title,
          file_url: fileUrl
        })
        .select()
        .single()

      if (streamingError) throw streamingError

      // Create music-specific content
      const { error: musicError } = await supabase
        .from('music_content')
        .insert({
          streaming_content_id: streamingContent.id,
          artist_name: artistName,
          ...metadata
        })

      if (musicError) throw musicError

      return { success: true, contentId: streamingContent.id }
    } catch (error) {
      console.error('Error uploading music:', error)
      return { success: false, error: error.message }
    }
  }

  // Upload podcast content
  async uploadPodcast(
    postId: string,
    title: string,
    podcastName: string,
    fileUrl: string,
    metadata: {
      episodeNumber?: number
      seasonNumber?: number
      hostName?: string
      guestName?: string
      topic?: string
      category?: string
      language?: string
      transcript?: string
      showNotes?: string
      chapterMarkers?: any[]
    }
  ): Promise<{ success: boolean; contentId?: string; error?: string }> {
    try {
      // Create streaming content
      const { data: streamingContent, error: streamingError } = await supabase
        .from('streaming_content')
        .insert({
          post_id: postId,
          content_type: 'podcast',
          title,
          file_url: fileUrl
        })
        .select()
        .single()

      if (streamingError) throw streamingError

      // Create podcast-specific content
      const { error: podcastError } = await supabase
        .from('podcast_content')
        .insert({
          streaming_content_id: streamingContent.id,
          podcast_name: podcastName,
          ...metadata
        })

      if (podcastError) throw podcastError

      return { success: true, contentId: streamingContent.id }
    } catch (error) {
      console.error('Error uploading podcast:', error)
      return { success: false, error: error.message }
    }
  }

  // Upload video content
  async uploadVideo(
    postId: string,
    title: string,
    fileUrl: string,
    metadata: {
      director?: string
      producer?: string
      cast?: string[]
      genre?: string
      rating?: string
      releaseDate?: string
      durationMinutes?: number
      language?: string
      subtitlesAvailable?: boolean
      subtitlesLanguages?: string[]
    }
  ): Promise<{ success: boolean; contentId?: string; error?: string }> {
    try {
      // Create streaming content
      const { data: streamingContent, error: streamingError } = await supabase
        .from('streaming_content')
        .insert({
          post_id: postId,
          content_type: 'video',
          title,
          file_url: fileUrl
        })
        .select()
        .single()

      if (streamingError) throw streamingError

      // Create video-specific content
      const { error: videoError } = await supabase
        .from('video_content')
        .insert({
          streaming_content_id: streamingContent.id,
          ...metadata
        })

      if (videoError) throw videoError

      return { success: true, contentId: streamingContent.id }
    } catch (error) {
      console.error('Error uploading video:', error)
      return { success: false, error: error.message }
    }
  }

  // Create event
  async createEvent(
    postId: string,
    eventName: string,
    eventType: string,
    startDate: string,
    endDate: string,
    metadata: {
      description?: string
      venueName?: string
      venueAddress?: string
      venueCapacity?: number
      timezone?: string
      isVirtual?: boolean
      virtualUrl?: string
      organizerName?: string
      organizerContact?: string
      ageRestriction?: string
      dressCode?: string
      cancellationPolicy?: string
      refundPolicy?: string
    }
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          post_id: postId,
          event_name: eventName,
          event_type: eventType,
          start_date: startDate,
          end_date: endDate,
          ...metadata
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, eventId: data.id }
    } catch (error) {
      console.error('Error creating event:', error)
      return { success: false, error: error.message }
    }
  }

  // Create event ticket
  async createEventTicket(
    eventId: string,
    ticketName: string,
    price: number,
    quantityAvailable: number,
    metadata: {
      description?: string
      currency?: string
      maxPerPerson?: number
      saleStartDate?: string
      saleEndDate?: string
      isTransferable?: boolean
      isRefundable?: boolean
      refundDeadline?: string
    }
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .insert({
          event_id: eventId,
          ticket_name: ticketName,
          price,
          quantity_available: quantityAvailable,
          ...metadata
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, ticketId: data.id }
    } catch (error) {
      console.error('Error creating event ticket:', error)
      return { success: false, error: error.message }
    }
  }

  // Purchase tickets
  async purchaseTickets(
    eventId: string,
    ticketId: string,
    buyerId: string,
    quantity: number,
    paymentMethod: string,
    paymentReference: string
  ): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
    try {
      // Get ticket details
      const { data: ticket, error: ticketError } = await supabase
        .from('event_tickets')
        .select('price, currency, quantity_available, quantity_sold')
        .eq('id', ticketId)
        .single()

      if (ticketError) throw ticketError

      // Check availability
      if (ticket.quantity_available < quantity) {
        return { success: false, error: 'Not enough tickets available' }
      }

      const totalPrice = ticket.price * quantity

      // Create ticket purchase
      const { data, error } = await supabase
        .from('ticket_purchases')
        .insert({
          event_id: eventId,
          ticket_id: ticketId,
          buyer_id: buyerId,
          quantity,
          total_price: totalPrice,
          currency: ticket.currency,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          status: 'confirmed'
        })
        .select()
        .single()

      if (error) throw error

      // Update ticket quantities
      await supabase
        .from('event_tickets')
        .update({
          quantity_sold: ticket.quantity_sold + quantity
        })
        .eq('id', ticketId)

      return { success: true, purchaseId: data.id }
    } catch (error) {
      console.error('Error purchasing tickets:', error)
      return { success: false, error: error.message }
    }
  }

  // Get streaming content
  async getStreamingContent(contentId: string): Promise<StreamingContent | null> {
    try {
      const { data, error } = await supabase
        .from('streaming_content')
        .select('*')
        .eq('id', contentId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting streaming content:', error)
      return null
    }
  }

  // Get events
  async getEvents(filters?: {
    eventType?: string
    startDate?: string
    endDate?: string
    isVirtual?: boolean
  }): Promise<Event[]> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true })

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType)
      }
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate)
      }
      if (filters?.isVirtual !== undefined) {
        query = query.eq('is_virtual', filters.isVirtual)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting events:', error)
      return []
    }
  }

  // Get event tickets
  async getEventTickets(eventId: string): Promise<EventTicket[]> {
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting event tickets:', error)
      return []
    }
  }

  // Track streaming analytics
  async trackStreaming(
    contentId: string,
    userId: string,
    actionType: string,
    durationPlayed?: number,
    completionRate?: number,
    deviceType?: string
  ): Promise<void> {
    try {
      await supabase
        .from('streaming_analytics')
        .insert({
          streaming_content_id: contentId,
          user_id: userId,
          action_type: actionType,
          duration_played: durationPlayed,
          completion_rate: completionRate,
          device_type: deviceType
        })
    } catch (error) {
      console.error('Error tracking streaming:', error)
    }
  }

  // Create playlist
  async createPlaylist(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<{ success: boolean; playlistId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: userId,
          name,
          description,
          is_public: isPublic
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, playlistId: data.id }
    } catch (error) {
      console.error('Error creating playlist:', error)
      return { success: false, error: error.message }
    }
  }

  // Add track to playlist
  async addTrackToPlaylist(
    playlistId: string,
    contentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          streaming_content_id: contentId
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error adding track to playlist:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user's playlists
  async getUserPlaylists(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_tracks (
            streaming_content_id,
            streaming_content (
              title,
              file_url,
              thumbnail_url,
              duration
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting user playlists:', error)
      return []
    }
  }
}

export const streamingService = new StreamingService()
