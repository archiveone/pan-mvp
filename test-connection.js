// Simple test script to verify Supabase connection
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not found!')
  console.error('Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...')
    
    // Test basic connection with your existing posts table
    const { data, error } = await supabase
      .from('posts')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.error('\n📋 Next steps:')
      console.error('1. Your posts table exists but may have RLS policies')
      console.error('2. Try signing up for an account in the app')
      console.error('3. The app will work once you authenticate')
      return
    }

    console.log('✅ Database connection successful!')
    
    // Test auth connection
    console.log('\n🔍 Testing auth connection...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth connection failed:', authError.message)
      return
    }

    console.log('✅ Auth connection successful!')
    console.log('\n🎉 Your Supabase setup is working correctly!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

testConnection()
