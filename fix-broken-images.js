// Fix broken placeholder image URLs
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://sjukjubqohkxqjoovqdw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdWtqdWJxb2hreHFqb292cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzUxMzIsImV4cCI6MjA3NTAxMTEzMn0.pr83q0h_gJjcS1k2s3bQ8l2tdDkInvqsZPmKGMefSOw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixBrokenImages() {
  console.log('🔧 Fixing broken placeholder image URLs...')
  
  try {
    // Get all posts with broken placeholder URLs
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, media_url')
      .like('media_url', '%placeholder.com%')
    
    if (fetchError) {
      console.error('❌ Error fetching posts:', fetchError)
      return
    }

    console.log(`Found ${posts.length} posts with broken placeholder images`)

    // Update each post with a working image URL
    for (const post of posts) {
      const newImageUrl = `https://picsum.photos/400/400?random=${post.id}`
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ media_url: newImageUrl })
        .eq('id', post.id)

      if (updateError) {
        console.error(`❌ Error updating post ${post.id}:`, updateError)
      } else {
        console.log(`✅ Updated post "${post.title}" with new image URL`)
      }
    }

    console.log('🎉 All broken images fixed!')

  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixBrokenImages()
