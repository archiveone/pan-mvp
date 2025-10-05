// Debug script to check profiles table access
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjukjubqohkxqjoovqdw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdWtqdWJxb2hreHFqb292cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzEsImV4cCI6MjA1MDU1MDg3MX0.7K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8Z8K8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProfilesTable() {
  try {
    console.log('🔍 Debugging profiles table access...')
    
    // Test 1: Check if we can read from profiles table
    console.log('\n1. Testing profiles table read access...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Profiles table read error:', profilesError)
      console.error('Error details:', JSON.stringify(profilesError, null, 2))
    } else {
      console.log('✅ Profiles table read successful:', profiles)
    }
    
    // Test 2: Check current user
    console.log('\n2. Checking authentication...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ User auth error:', userError)
      return
    }
    
    if (!user) {
      console.log('⚠️ No user logged in - this might be the issue!')
      return
    }
    
    console.log('✅ User authenticated:', user.id)
    
    // Test 3: Check user's profile
    console.log('\n3. Checking user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (profileError) {
      console.error('❌ Profile read error:', profileError)
      console.error('Error details:', JSON.stringify(profileError, null, 2))
    } else {
      console.log('✅ Profile read successful:', profile)
    }
    
    // Test 4: Try a simple update
    console.log('\n4. Testing profile update...')
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        name: 'Debug Test Update',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Update error:', updateError)
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
      console.error('Update error message:', updateError.message)
      console.error('Update error code:', updateError.code)
      console.error('Update error hint:', updateError.hint)
    } else {
      console.log('✅ Update successful:', updateResult)
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
  }
}

debugProfilesTable()
