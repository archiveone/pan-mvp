import { supabase } from '../lib/supabase';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface MediaFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  uploadedAt: string;
  userId: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnailUrl?: string;
  };
}

export interface UploadResult {
  success: boolean;
  file?: MediaFile;
  error?: string;
  progress?: UploadProgress;
}

export class MediaUploadService {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (increased for video/audio)
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  private static readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
  private static readonly ALLOWED_AUDIO_TYPES = [
    'audio/mpeg', // mp3
    'audio/mp4', // m4a
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
  ];
  private static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 100MB' };
    }

    // Check file type
    const allowedTypes = [
      ...this.ALLOWED_IMAGE_TYPES,
      ...this.ALLOWED_VIDEO_TYPES,
      ...this.ALLOWED_AUDIO_TYPES,
      ...this.ALLOWED_DOCUMENT_TYPES,
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' };
    }

    return { valid: true };
  }

  /**
   * Get file type category
   */
  static getFileCategory(file: File): 'image' | 'video' | 'audio' | 'document' {
    if (this.ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image';
    if (this.ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video';
    if (this.ALLOWED_AUDIO_TYPES.includes(file.type)) return 'audio';
    if (this.ALLOWED_DOCUMENT_TYPES.includes(file.type)) return 'document';
    return 'document'; // fallback
  }

  /**
   * Generate unique file path
   */
  static generateFilePath(userId: string, file: File): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'bin';
    const category = this.getFileCategory(file);
    
    return `${category}s/${userId}/${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Upload file to Supabase Storage
   */
  static async uploadFile(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const filePath = this.generateFilePath(userId, file);
      const fileCategory = this.getFileCategory(file);

      // Create progress tracking
      const progressCallback = onProgress ? (event: ProgressEvent) => {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      } : undefined;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Create media file record
      const mediaFile: MediaFile = {
        id: data.path,
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: fileCategory,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        userId: userId,
      };

      // For images, try to get dimensions
      if (fileCategory === 'image') {
        try {
          const dimensions = await this.getImageDimensions(file);
          mediaFile.metadata = {
            width: dimensions.width,
            height: dimensions.height,
          };
        } catch (error) {
          console.warn('Could not get image dimensions:', error);
        }
      }

      // For videos, we could extract duration and create thumbnail
      if (fileCategory === 'video') {
        try {
          const videoInfo = await this.getVideoInfo(file);
          mediaFile.metadata = {
            duration: videoInfo.duration,
            thumbnailUrl: videoInfo.thumbnailUrl,
          };
        } catch (error) {
          console.warn('Could not get video info:', error);
        }
      }

      // For audio, extract duration and metadata
      if (fileCategory === 'audio') {
        try {
          const audioInfo = await this.getAudioInfo(file);
          mediaFile.metadata = {
            duration: audioInfo.duration,
          };
        } catch (error) {
          console.warn('Could not get audio info:', error);
        }
      }

      return { success: true, file: mediaFile };
    } catch (error: any) {
      console.error('Upload failed:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(
    files: File[],
    userId: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progressCallback = onProgress ? (progress: UploadProgress) => {
        onProgress(i, progress);
      } : undefined;

      const result = await this.uploadFile(file, userId, progressCallback);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from('media')
        .remove([fileId]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete failed:', error);
      return { success: false, error: error.message || 'Delete failed' };
    }
  }

  /**
   * Get user's uploaded files
   */
  static async getUserFiles(userId: string): Promise<{ success: boolean; files?: MediaFile[]; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('List files error:', error);
        return { success: false, error: error.message };
      }

      const files: MediaFile[] = (data || []).map(item => ({
        id: item.name,
        url: supabase.storage.from('media').getPublicUrl(`${userId}/${item.name}`).data.publicUrl,
        name: item.name,
        size: item.metadata?.size || 0,
        type: this.getFileCategoryFromName(item.name),
        mimeType: item.metadata?.mimetype || 'application/octet-stream',
        uploadedAt: item.created_at,
        userId: userId,
      }));

      return { success: true, files };
    } catch (error: any) {
      console.error('Get user files failed:', error);
      return { success: false, error: error.message || 'Failed to get files' };
    }
  }

  /**
   * Get image dimensions
   */
  private static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get video info (duration and thumbnail)
   */
  private static getVideoInfo(file: File): Promise<{ duration: number; thumbnailUrl?: string }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Get duration
        const duration = video.duration;
        
        // Create thumbnail
        video.currentTime = 1; // Seek to 1 second
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve({ duration, thumbnailUrl });
          } else {
            resolve({ duration });
          }
        };
      };
      
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get audio info (duration)
   */
  private static getAudioInfo(file: File): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        URL.revokeObjectURL(audio.src);
        resolve({ duration });
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        reject(new Error('Failed to load audio metadata'));
      };
      
      audio.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get file category from filename
   */
  private static getFileCategoryFromName(filename: string): 'image' | 'video' | 'audio' | 'document' {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mpeg'];
    const audioExtensions = ['mp3', 'm4a', 'wav', 'ogg', 'aac', 'flac'];
    
    if (imageExtensions.includes(extension || '')) return 'image';
    if (videoExtensions.includes(extension || '')) return 'video';
    if (audioExtensions.includes(extension || '')) return 'audio';
    return 'document';
  }

  /**
   * Create image thumbnail
   */
  static async createThumbnail(
    file: File,
    maxWidth: number = 300,
    maxHeight: number = 300,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const thumbnail = canvas.toDataURL('image/jpeg', quality);
          resolve(thumbnail);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Compress image file
   */
  static async compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Could not compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}
