// Diagnose Supabase configuration issues
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Supabase Configuration Diagnosis\n')

console.log('Environment Variables:')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING')
console.log('Key Length:', supabaseKey ? supabaseKey.length : 0)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure .env.local exists with:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseAuth() {
  try {
    console.log('\n🔍 Testing Authentication...')
    
    // Test 1: Basic auth connection
    console.log('\n1. Testing basic auth connection...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
    } else {
      console.log('✅ Session check successful')
      console.log('Current session:', sessionData.session ? 'Active' : 'None')
    }

    // Test 2: Try to sign up a test user
    console.log('\n2. Testing sign up...')
    const testEmail = `test-${Date.now()}@example.com`
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123'
    })

    if (signupError) {
      console.error('❌ Sign up error:', signupError.message)
      console.error('Error details:', signupError)
    } else {
      console.log('✅ Sign up successful!')
      console.log('User ID:', signupData.user?.id)
      console.log('Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No')
      
      // Clean up test user
      if (signupData.user) {
        console.log('\n🧹 Cleaning up test user...')
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id)
        if (deleteError) {
          console.log('Note: Could not delete test user (normal for non-admin)')
        } else {
          console.log('✅ Test user cleaned up')
        }
      }
    }

    // Test 3: Check database access
    console.log('\n3. Testing database access...')
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('count')
      .limit(1)

    if (postsError) {
      console.error('❌ Posts table error:', postsError.message)
      console.error('Error code:', postsError.code)
      console.error('Error details:', postsError.details)
    } else {
      console.log('✅ Posts table accessible')
    }

    // Test 4: Check profiles table
    console.log('\n4. Testing profiles table...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message)
      console.error('Error code:', profilesError.code)
      console.error('Error details:', profilesError.details)
    } else {
      console.log('✅ Profiles table accessible')
    }

    // Test 5: Check project status
    console.log('\n5. Checking project configuration...')
    console.log('Project URL format:', supabaseUrl.includes('supabase.co') ? 'Correct' : 'Incorrect')
    console.log('Key format:', supabaseKey.startsWith('eyJ') ? 'JWT format (correct)' : 'Incorrect format')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

diagnoseAuth()


