import { supabase } from '@/lib/supabase';

export interface SimpleListingData {
  type: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  category: string;
  businessType: string;
  location?: string;
  date?: string;
  capacity?: number;
}

export async function createSimpleListing(data: SimpleListingData, userId: string) {
  try {
    // Create the main listing with only the columns that exist
    const { data: listing, error: listingError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title: data.title,
        content: data.description,
        price: data.price,
        currency: data.currency,
        tags: data.tags,
        category: data.category,
        type: data.type,
        business_type: data.businessType,
        location: data.location,
        event_date: data.date,
        capacity: data.capacity,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (listingError) {
      throw new Error(`Failed to create listing: ${listingError.message}`);
    }

    return { success: true, listing };
  } catch (error) {
    console.error('Error creating simple listing:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function uploadSimpleMedia(files: File[], postId: string) {
  try {
    console.log(`Starting upload of ${files.length} files for post ${postId}`);
    
    const uploadPromises = files.map(async (file, index) => {
      console.log(`Uploading file ${index + 1}/${files.length}: ${file.name}`);
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${postId}_${Date.now()}_${index}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      console.log(`Uploading to path: ${filePath}`);

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`Upload error for ${file.name}:`, uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      console.log(`Successfully uploaded ${file.name}`);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return {
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        post_id: postId,
        created_at: new Date().toISOString()
      };
    });

    console.log('Waiting for all uploads to complete...');
    const mediaData = await Promise.all(uploadPromises);
    console.log(`All ${mediaData.length} files uploaded successfully`);

    // Try to save media metadata to database (if table exists)
    try {
      console.log('Saving media metadata to database...');
      const { error: mediaError } = await supabase
        .from('post_media')
        .insert(mediaData);

      if (mediaError) {
        console.warn('Failed to save media metadata:', mediaError.message);
        // Don't throw error here, upload was successful
      } else {
        console.log('Media metadata saved successfully');
      }
    } catch (error) {
      console.warn('Media metadata table may not exist:', error);
      // Don't throw error here, upload was successful
    }

    console.log('Upload process completed successfully');
    return { success: true, media: mediaData };
  } catch (error) {
    console.error('Error uploading simple media:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}