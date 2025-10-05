// Test script to explore existing Supabase database structure
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function exploreDatabase() {
  try {
    console.log('🔍 Exploring your existing database...\n')

    // Test profiles table
    console.log('📋 Testing profiles table:')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3)

    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message)
    } else {
      console.log('✅ Profiles table found!')
      if (profiles && profiles.length > 0) {
        console.log('Sample profile structure:', JSON.stringify(profiles[0], null, 2))
      } else {
        console.log('No profiles found')
      }
    }

    console.log('\n📋 Testing posts table:')
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(3)

    if (postsError) {
      console.log('❌ Posts table error:', postsError.message)
    } else {
      console.log('✅ Posts table found!')
      if (posts && posts.length > 0) {
        console.log('Sample post structure:', JSON.stringify(posts[0], null, 2))
      } else {
        console.log('No posts found')
      }
    }

    console.log('\n📋 Testing comments table:')
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(3)

    if (commentsError) {
      console.log('❌ Comments table error:', commentsError.message)
    } else {
      console.log('✅ Comments table found!')
      if (comments && comments.length > 0) {
        console.log('Sample comment structure:', JSON.stringify(comments[0], null, 2))
      } else {
        console.log('No comments found')
      }
    }

    console.log('\n📋 Testing notifications table:')
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(3)

    if (notificationsError) {
      console.log('❌ Notifications table error:', notificationsError.message)
    } else {
      console.log('✅ Notifications table found!')
      if (notifications && notifications.length > 0) {
        console.log('Sample notification structure:', JSON.stringify(notifications[0], null, 2))
      } else {
        console.log('No notifications found')
      }
    }

    console.log('\n📋 Testing saves table:')
    const { data: saves, error: savesError } = await supabase
      .from('saves')
      .select('*')
      .limit(3)

    if (savesError) {
      console.log('❌ Saves table error:', savesError.message)
    } else {
      console.log('✅ Saves table found!')
      if (saves && saves.length > 0) {
        console.log('Sample save structure:', JSON.stringify(saves[0], null, 2))
      } else {
        console.log('No saves found')
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

exploreDatabase()

