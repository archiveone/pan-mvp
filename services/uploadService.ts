import { supabase } from '@/lib/supabase'

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  success: boolean
  url?: string
  urls?: string[]
  error?: string
}

export class UploadService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  private static readonly UPLOAD_TIMEOUT = 30000 // 30 seconds
  private static readonly CHUNK_SIZE = 1024 * 1024 // 1MB chunks

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' }
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB` }
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' }
    }

    return { valid: true }
  }

  /**
   * Generate unique file path
   */
  static generateFilePath(userId: string, file: File, folder: string = 'uploads'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const extension = file.name.split('.').pop() || 'bin'
    return `${folder}/${userId}/${timestamp}-${random}.${extension}`
  }

  /**
   * Upload single file with progress tracking
   */
  static async uploadFile(
    file: File,
    userId: string,
    bucket: string = 'media',
    folder: string = 'uploads',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate file path
      const filePath = this.generateFilePath(userId, file, folder)
      console.log(`📝 Upload path: ${filePath}`)

      // Create upload promise with timeout
      const uploadPromise = this.performUpload(file, filePath, bucket, onProgress)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Upload timeout after ${this.UPLOAD_TIMEOUT / 1000} seconds`))
        }, this.UPLOAD_TIMEOUT)
      })

      // Race between upload and timeout
      const result = await Promise.race([uploadPromise, timeoutPromise])

      if (result.error) {
        console.error('❌ Upload failed:', result.error)
        return { success: false, error: result.error }
      }

      console.log('✅ Upload successful:', result.url)
      return { success: true, url: result.url }

    } catch (error) {
      console.error('❌ Upload error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }
    }
  }

  /**
   * Perform the actual upload
   */
  private static async performUpload(
    file: File,
    filePath: string,
    bucket: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url?: string; error?: string }> {
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        throw new Error(`Failed to check storage buckets: ${bucketsError.message}`)
      }

      const bucketExists = buckets?.some(b => b.name === bucket)
      if (!bucketExists) {
        throw new Error(`Storage bucket '${bucket}' does not exist. Please create it in Supabase Dashboard → Storage`)
      }

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return { url: publicUrl }

    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' }
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(
    files: File[],
    userId: string,
    bucket: string = 'media',
    folder: string = 'uploads',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Starting batch upload: ${files.length} files`)

      if (files.length === 0) {
        return { success: true, urls: [] }
      }

      const uploadPromises = files.map(async (file, index) => {
        console.log(`📤 Uploading file ${index + 1}/${files.length}: ${file.name}`)
        
        const result = await this.uploadFile(file, userId, bucket, folder, (progress) => {
          // Calculate overall progress
          const overallProgress = {
            loaded: (index * 100) + progress.percentage,
            total: files.length * 100,
            percentage: Math.round(((index * 100) + progress.percentage) / files.length)
          }
          onProgress?.(overallProgress)
        })

        if (!result.success) {
          throw new Error(`Failed to upload ${file.name}: ${result.error}`)
        }

        return result.url!
      })

      const urls = await Promise.all(uploadPromises)
      console.log(`✅ Batch upload successful: ${urls.length} files`)

      return { success: true, urls }

    } catch (error) {
      console.error('❌ Batch upload failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Batch upload failed' 
      }
    }
  }

  /**
   * Create storage buckets if they don't exist
   */
  static async ensureBucketsExist(): Promise<{ success: boolean; error?: string }> {
    try {
      const requiredBuckets = ['media', 'content-images', 'content-videos', 'content-audio', 'content-documents']
      
      for (const bucketName of requiredBuckets) {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        
        if (bucketsError) {
          console.error(`Error checking buckets: ${bucketsError.message}`)
          continue
        }

        const bucketExists = buckets?.some(b => b.name === bucketName)
        
        if (!bucketExists) {
          console.log(`Creating bucket: ${bucketName}`)
          
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: null,
            fileSizeLimit: 52428800 // 50MB
          })

          if (createError) {
            console.error(`Failed to create bucket ${bucketName}:`, createError.message)
          } else {
            console.log(`✅ Created bucket: ${bucketName}`)
          }
        } else {
          console.log(`✅ Bucket exists: ${bucketName}`)
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error ensuring buckets exist:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create buckets' 
      }
    }
  }

  /**
   * Test upload connection
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test Supabase connection
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        return { success: false, error: `Supabase connection failed: ${error.message}` }
      }

      // Ensure buckets exist
      const bucketResult = await this.ensureBucketsExist()
      if (!bucketResult.success) {
        return { success: false, error: bucketResult.error }
      }

      return { success: true }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      }
    }
  }
}
