import { supabase } from '@/lib/supabase'

export interface SimpleListingData {
  title: string
  description: string
  price?: number
  currency?: string
  tags?: string[]
  category?: string
  type?: string
  businessType?: string
  location?: string
  date?: string
  capacity?: number
  images?: File[]
}

export async function createSimpleListingV2(userId: string, data: SimpleListingData) {
  try {
    console.log('Creating listing with data:', data)
    
    // Create the listing with only basic fields that should exist
    const { data: listing, error: listingError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title: data.title,
        content: data.description,
        // Only include fields that definitely exist
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Default safety fields
        is_safety_approved: false,
        safety_checked: false,
        safety_score: 0
      })
      .select()
      .single()

    if (listingError) {
      console.error('Listing creation error:', listingError)
      throw new Error(`Failed to create listing: ${listingError.message}`)
    }

    console.log('Listing created successfully:', listing)

    // Call moderation API
    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.description,
          tags: data.tags || [],
          media_url: null
        })
      })
      const json = await res.json()
      if (json?.success) {
        const { result } = json
        const action = result?.action as 'allow' | 'review' | 'block' | 'age_restrict'
        const approved = action === 'allow'
        // Update post safety fields
        await supabase
          .from('posts')
          .update({
            safety_checked: true,
            safety_score: result?.score || 0,
            is_safety_approved: approved,
            is_flagged: !approved,
            safety_violations: result?.violations || null
          })
          .eq('id', (listing as any).id)
      }
    } catch (e) {
      console.warn('Moderation call failed, leaving post pending review', e)
    }

    return { success: true, listing }
  } catch (error) {
    console.error('Error creating simple listing:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function uploadSimpleMediaV2(postId: string, files: File[]) {
  try {
    console.log('Uploading media for post:', postId, 'Files:', files.length)
    
    if (!files || files.length === 0) {
      console.log('No files to upload')
      return { success: true, media: [] }
    }

    // For now, just save the first image URL to the posts table
    // This is a simplified approach that works with the existing database structure
    const firstFile = files[0]
    
        // Create a simple URL for the image (in a real app, you'd upload to storage)
        const imageUrl = `https://picsum.photos/400/400?random=${Date.now()}`
    
    console.log('Using placeholder image URL:', imageUrl)
    
    // Update the post with the media URL
    const { error: updateError } = await supabase
      .from('posts')
      .update({ media_url: imageUrl })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post with media URL:', updateError)
      throw new Error(`Failed to update post with media: ${updateError.message}`)
    }

    console.log('Post updated with media URL successfully')
    
    return { 
      success: true, 
      media: [{
        file_name: firstFile.name,
        file_url: imageUrl,
        file_type: firstFile.type,
        file_size: firstFile.size
      }]
    }
  } catch (error) {
    console.error('Error uploading simple media:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
