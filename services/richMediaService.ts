import { supabase } from '@/lib/supabase'

export interface MusicPost {
  id: string
  user_id: string
  title: string
  artist: string
  album?: string
  audio_url: string
  cover_image_url?: string
  duration: number
  genre?: string
  is_saveable: boolean
  play_count: number
  save_count: number
  created_at: string
}

export interface VideoPost {
  id: string
  user_id: string
  title: string
  description?: string
  video_url: string
  thumbnail_url?: string
  duration: number
  resolution?: string
  is_downloadable: boolean
  view_count: number
  created_at: string
}

export interface DocumentPost {
  id: string
  user_id: string
  title: string
  description?: string
  document_url: string
  file_type: string // pdf, doc, docx, xls, xlsx, ppt, pptx
  file_size: number
  page_count?: number
  is_downloadable: boolean
  download_count: number
  created_at: string
}

export class RichMediaService {
  // === MUSIC POSTS ===

  static async createMusicPost(data: {
    userId: string
    title: string
    artist: string
    album?: string
    audioFile: File
    coverImage?: File
    duration: number
    genre?: string
    isSaveable?: boolean
  }): Promise<{ success: boolean; post?: MusicPost; error?: string }> {
    try {
      // Upload audio file
      const audioFileName = `music/${data.userId}/${Date.now()}_${data.audioFile.name}`
      const { data: audioData, error: audioError } = await supabase.storage
        .from('media')
        .upload(audioFileName, data.audioFile)

      if (audioError) throw audioError

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(audioFileName)

      // Upload cover image if provided
      let coverImageUrl: string | undefined
      if (data.coverImage) {
        const imageFileName = `music/covers/${data.userId}/${Date.now()}_${data.coverImage.name}`
        const { data: imageData, error: imageError } = await supabase.storage
          .from('media')
          .upload(imageFileName, data.coverImage)

        if (!imageError) {
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(imageFileName)
          coverImageUrl = publicUrl
        }
      }

      // Create music post
      const { data: post, error } = await supabase
        .from('music_posts')
        .insert({
          user_id: data.userId,
          title: data.title,
          artist: data.artist,
          album: data.album,
          audio_url: audioUrl,
          cover_image_url: coverImageUrl,
          duration: data.duration,
          genre: data.genre,
          is_saveable: data.isSaveable ?? true,
          play_count: 0,
          save_count: 0
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, post: post as MusicPost }
    } catch (error: any) {
      console.error('Create music post error:', error)
      return { success: false, error: error.message }
    }
  }

  static async getMusicPosts(): Promise<{ success: boolean; posts?: MusicPost[]; error?: string }> {
    try {
      const { data: posts, error } = await supabase
        .from('music_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, posts: posts as MusicPost[] }
    } catch (error: any) {
      console.error('Get music posts error:', error)
      return { success: false, error: error.message }
    }
  }

  static async saveMusicPost(userId: string, postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('saved_music')
        .insert({
          user_id: userId,
          music_post_id: postId
        })

      if (error) throw error

      // Increment save count
      await supabase.rpc('increment_music_saves', { post_id: postId })

      return { success: true }
    } catch (error: any) {
      console.error('Save music post error:', error)
      return { success: false, error: error.message }
    }
  }

  // === VIDEO POSTS ===

  static async createVideoPost(data: {
    userId: string
    title: string
    description?: string
    videoFile: File
    thumbnail?: File
    isDownloadable?: boolean
  }): Promise<{ success: boolean; post?: VideoPost; error?: string }> {
    try {
      // Upload video file
      const videoFileName = `videos/${data.userId}/${Date.now()}_${data.videoFile.name}`
      const { data: videoData, error: videoError } = await supabase.storage
        .from('media')
        .upload(videoFileName, data.videoFile)

      if (videoError) throw videoError

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(videoFileName)

      // Upload thumbnail if provided
      let thumbnailUrl: string | undefined
      if (data.thumbnail) {
        const thumbFileName = `videos/thumbnails/${data.userId}/${Date.now()}_${data.thumbnail.name}`
        const { error: thumbError } = await supabase.storage
          .from('media')
          .upload(thumbFileName, data.thumbnail)

        if (!thumbError) {
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(thumbFileName)
          thumbnailUrl = publicUrl
        }
      }

      // Get video duration (would need to be calculated on frontend)
      const duration = 0 // Placeholder

      // Create video post
      const { data: post, error } = await supabase
        .from('video_posts')
        .insert({
          user_id: data.userId,
          title: data.title,
          description: data.description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: duration,
          is_downloadable: data.isDownloadable ?? false,
          view_count: 0
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, post: post as VideoPost }
    } catch (error: any) {
      console.error('Create video post error:', error)
      return { success: false, error: error.message }
    }
  }

  static async incrementVideoViews(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase.rpc('increment_video_views', { post_id: postId })
      return { success: true }
    } catch (error: any) {
      console.error('Increment video views error:', error)
      return { success: false, error: error.message }
    }
  }

  // === DOCUMENT POSTS ===

  static async createDocumentPost(data: {
    userId: string
    title: string
    description?: string
    documentFile: File
    isDownloadable?: boolean
  }): Promise<{ success: boolean; post?: DocumentPost; error?: string }> {
    try {
      // Determine file type
      const fileType = data.documentFile.name.split('.').pop()?.toLowerCase() || 'unknown'
      const fileSize = data.documentFile.size

      // Upload document file
      const docFileName = `documents/${data.userId}/${Date.now()}_${data.documentFile.name}`
      const { data: docData, error: docError } = await supabase.storage
        .from('media')
        .upload(docFileName, data.documentFile)

      if (docError) throw docError

      const { data: { publicUrl: documentUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(docFileName)

      // Create document post
      const { data: post, error } = await supabase
        .from('document_posts')
        .insert({
          user_id: data.userId,
          title: data.title,
          description: data.description,
          document_url: documentUrl,
          file_type: fileType,
          file_size: fileSize,
          is_downloadable: data.isDownloadable ?? true,
          download_count: 0
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, post: post as DocumentPost }
    } catch (error: any) {
      console.error('Create document post error:', error)
      return { success: false, error: error.message }
    }
  }

  static async incrementDocumentDownloads(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase.rpc('increment_document_downloads', { post_id: postId })
      return { success: true }
    } catch (error: any) {
      console.error('Increment document downloads error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default RichMediaService

