// Test script to debug profile update issues
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjukjubqohkxqjoovqdw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdWtqdWJxb2hreHFqb292cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzEsImV4cCI6MjA1MDU1MDg3MX0.7K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProfileUpdate() {
  try {
    console.log('Testing profile update...')
    
    // Test 1: Check if profiles table exists and is accessible
    console.log('1. Testing profiles table access...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username')
      .limit(1)
    
    if (profilesError) {
      console.error('Profiles table error:', profilesError)
      return
    }
    console.log('Profiles table accessible:', profiles)
    
    // Test 2: Check current user
    console.log('2. Checking current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('User error:', userError)
      return
    }
    
    if (!user) {
      console.log('No user logged in')
      return
    }
    
    console.log('Current user:', user.id)
    
    // Test 3: Try to read user's profile
    console.log('3. Reading user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (profileError) {
      console.error('Profile read error:', profileError)
      return
    }
    
    console.log('User profile:', profile)
    
    // Test 4: Try a simple update
    console.log('4. Testing simple profile update...')
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ name: 'Test Update' })
      .eq('id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update error:', updateError)
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
    } else {
      console.log('Update successful:', updateResult)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testProfileUpdate()

