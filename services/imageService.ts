import { supabase } from '@/lib/supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  urls?: string[];
  error?: string;
}

export class ImageService {
  
  /**
   * Upload a single image file to Supabase Storage
   */
  static async uploadImage(
    file: File, 
    bucket: string = 'content-images',
    folder: string = 'listings'
  ): Promise<ImageUploadResult> {
    try {
      console.log(`📤 Uploading ${file.name} (${(file.size / 1024).toFixed(2)} KB) to ${bucket}/${folder}`);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log(`📝 Uploading to path: ${filePath}`);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log(`✅ Upload successful! URL: ${publicUrl}`);

      return {
        success: true,
        url: publicUrl
      };
    } catch (error) {
      console.error(`❌ Upload failed for ${file.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadImages(
    files: File[], 
    bucket: string = 'content-images',
    folder: string = 'listings'
  ): Promise<ImageUploadResult> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, bucket, folder));
      const results = await Promise.all(uploadPromises);

      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      if (failed.length > 0) {
        // Get the actual error messages from failed uploads
        const errorMessages = failed.map(f => f.error).filter(Boolean);
        const firstError = errorMessages[0] || 'Unknown error';
        console.error('❌ Failed uploads:', errorMessages);
        
        return {
          success: false,
          error: firstError // Return the first error message for detailed feedback
        };
      }

      return {
        success: true,
        urls: successful.map(result => result.url!).filter(Boolean)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete an image from Supabase Storage
   */
  static async deleteImage(url: string, bucket: string = 'content-images'): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get optimized image URL with size parameters
   */
  static getOptimizedImageUrl(
    originalUrl: string, 
    width?: number, 
    height?: number,
    quality: number = 80
  ): string {
    if (!originalUrl) return '';
    
    // For Supabase Storage, we can use transformations
    const url = new URL(originalUrl);
    
    if (width || height || quality !== 80) {
      const params = new URLSearchParams();
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      if (quality !== 80) params.append('quality', quality.toString());
      
      url.search = params.toString();
    }
    
    return url.toString();
  }

  /**
   * Get thumbnail URL for an image
   */
  static getThumbnailUrl(originalUrl: string, size: number = 300): string {
    return this.getOptimizedImageUrl(originalUrl, size, size, 70);
  }

  /**
   * Get medium size URL for an image
   */
  static getMediumUrl(originalUrl: string, size: number = 600): string {
    return this.getOptimizedImageUrl(originalUrl, size, size, 80);
  }

  /**
   * Get large size URL for an image
   */
  static getLargeUrl(originalUrl: string, size: number = 1200): string {
    return this.getOptimizedImageUrl(originalUrl, size, size, 90);
  }

  /**
   * Validate image file
   */
  static validateImage(file: File): {
    valid: boolean;
    error?: string;
  } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Please upload images smaller than 5MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Validate multiple image files
   */
  static validateImages(files: File[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check number of files
    if (files.length === 0) {
      errors.push('Please select at least one image.');
    }
    
    if (files.length > 10) {
      errors.push('Please select no more than 10 images.');
    }

    // Validate each file
    files.forEach((file, index) => {
      const validation = this.validateImage(file);
      if (!validation.valid) {
        errors.push(`Image ${index + 1}: ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create image preview URLs for file inputs
   */
  static createPreviewUrls(files: File[]): string[] {
    return files.map(file => URL.createObjectURL(file));
  }

  /**
   * Revoke preview URLs to free memory
   */
  static revokePreviewUrls(urls: string[]): void {
    urls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  /**
   * Get placeholder image URL
   */
  static getPlaceholderImage(text: string = 'No Image', width: number = 400, height: number = 400): string {
    return `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent(text)}`;
  }

  /**
   * Check if URL is a valid image URL
   */
  static isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return pathname.match(/\.(jpg|jpeg|png|gif|webp)$/) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get image dimensions from URL
   */
  static async getImageDimensions(url: string): Promise<{
    width: number;
    height: number;
  } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url;
    });
  }

  /**
   * Generate responsive image URLs for different screen sizes
   */
  static getResponsiveImageUrls(originalUrl: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumbnail: this.getThumbnailUrl(originalUrl, 150),
      small: this.getOptimizedImageUrl(originalUrl, 300, 300),
      medium: this.getMediumUrl(originalUrl, 600),
      large: this.getLargeUrl(originalUrl, 1200),
      original: originalUrl
    };
  }
}
