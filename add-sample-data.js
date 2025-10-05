// Add sample data to your existing database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function addSampleData() {
  try {
    console.log('🚀 Adding sample data to your database...\n')

    // First, let's create a test user profile
    const testUserId = '00000000-0000-0000-0000-000000000001'
    
    console.log('📝 Creating test profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert([
        {
          id: testUserId,
          bio: 'Demo User - Marketplace Tester'
        }
      ])

    if (profileError) {
      console.log('Profile error:', profileError.message)
    } else {
      console.log('✅ Test profile created/updated')
    }

    // Add sample posts (listings)
    console.log('\n📝 Adding sample posts...')
    const samplePosts = [
      {
        title: 'Vintage Camera',
        content: 'Beautiful vintage camera in excellent condition. Perfect for photography enthusiasts.',
        location: 'Dublin',
        user_id: testUserId
      },
      {
        title: 'Acoustic Guitar',
        content: 'Great acoustic guitar for beginners. Comes with case and picks.',
        location: 'Cork',
        user_id: testUserId
      },
      {
        title: 'Mountain Bike',
        content: 'Perfect mountain bike for city riding and light trails. Well maintained.',
        location: 'Galway',
        user_id: testUserId
      },
      {
        title: 'Book Collection',
        content: 'Collection of fiction and non-fiction books. Great variety for any reader.',
        location: 'Dublin',
        user_id: testUserId
      },
      {
        title: 'Wooden Table',
        content: 'Solid oak dining table, seats 6 people comfortably. Perfect for family dinners.',
        location: 'Limerick',
        user_id: testUserId
      },
      {
        title: 'Abstract Painting',
        content: 'Original artwork by local artist. Adds character to any room.',
        location: 'Dublin',
        user_id: testUserId
      }
    ]

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .upsert(samplePosts)

    if (postsError) {
      console.log('Posts error:', postsError.message)
    } else {
      console.log('✅ Sample posts added successfully!')
    }

    console.log('\n🎉 Sample data setup complete!')
    console.log('You can now test your marketplace app with real data.')

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

addSampleData()


