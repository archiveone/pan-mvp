// Test the moderation API endpoints
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://sjukjubqohkxqjoovqdw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdWtqdWJxb2hreHFqb292cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzUxMzIsImV4cCI6MjA3NTAxMTEzMn0.pr83q0h_gJjcS1k2s3bQ8l2tdDkInvqsZPmKGMefSOw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testModerationAPI() {
  console.log('🔍 Testing moderation API...')
  
  try {
    // Test 1: Check if moderation_actions table exists
    console.log('\n📋 Checking moderation_actions table...')
    const { data: actions, error: actionsError } = await supabase
      .from('moderation_actions')
      .select('*')
      .limit(1)
    
    if (actionsError) {
      console.error('❌ moderation_actions table error:', actionsError.message)
      if (actionsError.message.includes('relation "moderation_actions" does not exist')) {
        console.log('💡 You need to run the database-moderation.sql script in Supabase!')
        return
      }
    } else {
      console.log('✅ moderation_actions table accessible')
    }

    // Test 2: Check if roles table exists
    console.log('\n👥 Checking roles table...')
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(1)
    
    if (rolesError) {
      console.error('❌ roles table error:', rolesError.message)
      if (rolesError.message.includes('relation "roles" does not exist')) {
        console.log('💡 You need to run the database-moderation.sql script in Supabase!')
        return
      }
    } else {
      console.log('✅ roles table accessible')
    }

    // Test 3: Check moderation_queue view
    console.log('\n📊 Checking moderation_queue view...')
    const { data: queue, error: queueError } = await supabase
      .from('moderation_queue')
      .select('*')
      .limit(1)
    
    if (queueError) {
      console.error('❌ moderation_queue view error:', queueError.message)
    } else {
      console.log('✅ moderation_queue view accessible')
    }

    // Test 4: Try to get a post to test with
    console.log('\n📝 Getting a test post...')
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .limit(1)
    
    if (postsError) {
      console.error('❌ Posts error:', postsError.message)
    } else if (posts && posts.length > 0) {
      console.log('✅ Found test post:', posts[0].title)
      console.log('💡 You can test the API with post ID:', posts[0].id)
    } else {
      console.log('⚠️ No posts found to test with')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testModerationAPI()
