// Test the actual authentication flow
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthFlow() {
  try {
    console.log('🧪 Testing Authentication Flow\n')
    
    // Test with a proper email format
    const testEmail = `testuser${Date.now()}@test.com`
    const testPassword = 'testpassword123'
    
    console.log('📝 Test email:', testEmail)
    
    // Step 1: Sign up
    console.log('\n1. Testing sign up...')
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })

    if (signupError) {
      console.error('❌ Sign up error:', signupError.message)
      console.error('Error code:', signupError.code)
      return
    }

    console.log('✅ Sign up successful!')
    console.log('User ID:', signupData.user?.id)
    console.log('Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No')

    if (!signupData.user) {
      console.error('❌ No user data returned')
      return
    }

    // Step 2: Try to create profile
    console.log('\n2. Testing profile creation...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: signupData.user.id,
          bio: 'Test user profile'
        }
      ])
      .select()

    if (profileError) {
      console.error('❌ Profile creation error:', profileError.message)
      console.error('Error code:', profileError.code)
      console.error('Error details:', profileError.details)
    } else {
      console.log('✅ Profile creation successful!')
      console.log('Profile data:', profileData)
    }

    // Step 3: Test sign in
    console.log('\n3. Testing sign in...')
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signinError) {
      console.error('❌ Sign in error:', signinError.message)
    } else {
      console.log('✅ Sign in successful!')
      console.log('Session active:', signinData.session ? 'Yes' : 'No')
    }

    // Step 4: Test creating a post while authenticated
    if (signinData?.session) {
      console.log('\n4. Testing post creation while authenticated...')
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            title: 'Test Listing',
            content: 'This is a test listing',
            location: 'Test City',
            user_id: signinData.user.id
          }
        ])
        .select()

      if (postError) {
        console.error('❌ Post creation error:', postError.message)
        console.error('Error code:', postError.code)
      } else {
        console.log('✅ Post creation successful!')
        console.log('Post data:', postData)
      }
    }

    // Step 5: Test sign out
    console.log('\n5. Testing sign out...')
    const { error: signoutError } = await supabase.auth.signOut()
    
    if (signoutError) {
      console.error('❌ Sign out error:', signoutError.message)
    } else {
      console.log('✅ Sign out successful!')
    }

    console.log('\n🎉 Authentication flow test completed!')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testAuthFlow()


