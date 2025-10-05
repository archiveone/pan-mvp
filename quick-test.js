// Quick test to verify Supabase settings are fixed
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function quickTest() {
  console.log('🧪 Quick Supabase Test\n')
  
  // Test with a real-looking email
  const testEmail = `testuser${Date.now()}@gmail.com`
  const testPassword = 'testpassword123'
  
  console.log('📧 Testing with email:', testEmail)
  
  try {
    // Test sign up
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })

    if (error) {
      console.log('❌ Still getting errors:')
      console.log('Error:', error.message)
      console.log('Code:', error.code)
      console.log('\n🔧 You need to fix your Supabase settings!')
      console.log('Follow the steps in FIX-SUPABASE-SETTINGS.md')
      return
    }

    console.log('✅ Sign up successful!')
    console.log('User ID:', data.user?.id)
    console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No')
    
    if (data.user) {
      console.log('\n🎉 Your Supabase settings are working correctly!')
      console.log('You can now use the app with real email addresses.')
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

quickTest()


