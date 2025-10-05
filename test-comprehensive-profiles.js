// Test script for comprehensive profile schema
// Run this in your browser console or Node.js environment

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testComprehensiveProfiles() {
  console.log('🧪 Testing Comprehensive Profile Schema...\n')

  try {
    // Test 1: Check if profiles table exists and has all columns
    console.log('1️⃣ Checking profiles table structure...')
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' })
    
    if (columnsError) {
      console.log('⚠️  Could not check table structure (this is normal if RPC doesn\'t exist)')
    } else {
      console.log('✅ Profiles table structure:', columns)
    }

    // Test 2: Try to fetch existing profiles
    console.log('\n2️⃣ Fetching existing profiles...')
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    if (fetchError) {
      console.log('❌ Error fetching profiles:', fetchError.message)
      console.log('💡 This might mean the profiles table doesn\'t exist yet')
      console.log('💡 Run the migration script first: database-comprehensive-profiles-migration.sql')
    } else {
      console.log('✅ Found profiles:', profiles?.length || 0)
      if (profiles && profiles.length > 0) {
        console.log('📋 Sample profile fields:', Object.keys(profiles[0]))
      }
    }

    // Test 3: Test profile creation (if authenticated)
    console.log('\n3️⃣ Testing profile creation...')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('✅ User authenticated:', user.email)
      
      // Try to create/update a comprehensive profile
      const testProfile = {
        name: 'Test User',
        handle: `testuser_${Date.now()}`,
        bio: 'This is a test profile with comprehensive features',
        is_verified: false,
        is_business: false,
        show_stats: true,
        show_followers: true,
        show_posts: true,
        bio_safety_checked: false,
        bio_is_safety_approved: false,
        profile_type: 'personal',
        hub_theme: 'default',
        hub_layout: 'grid'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...testProfile
        })
        .select()

      if (insertError) {
        console.log('❌ Error creating profile:', insertError.message)
        console.log('💡 Make sure the profiles table exists and has all required columns')
      } else {
        console.log('✅ Profile created/updated successfully:', insertData)
      }
    } else {
      console.log('⚠️  No authenticated user - skipping profile creation test')
      console.log('💡 Sign in to test profile creation')
    }

    // Test 4: Test business profile creation
    console.log('\n4️⃣ Testing business profile features...')
    if (user) {
      const businessProfile = {
        name: 'Test Business',
        handle: `testbusiness_${Date.now()}`,
        bio: 'A test business account',
        is_business: true,
        business_type: 'retail',
        profile_type: 'business',
        hub_theme: 'corporate',
        show_stats: true,
        show_followers: false,
        stripe_customer_id: 'cus_test123'
      }

      const { data: businessData, error: businessError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...businessProfile
        })
        .select()

      if (businessError) {
        console.log('❌ Error creating business profile:', businessError.message)
      } else {
        console.log('✅ Business profile created successfully:', businessData)
      }
    }

    // Test 5: Test safety verification features
    console.log('\n5️⃣ Testing safety verification features...')
    if (user) {
      const safetyProfile = {
        bio_safety_checked: true,
        bio_safety_score: 85,
        bio_safety_violations: [],
        bio_is_safety_approved: true,
        verification_status: 'pending',
        verification_level: 'basic'
      }

      const { data: safetyData, error: safetyError } = await supabase
        .from('profiles')
        .update(safetyProfile)
        .eq('id', user.id)
        .select()

      if (safetyError) {
        console.log('❌ Error updating safety features:', safetyError.message)
      } else {
        console.log('✅ Safety features updated successfully:', safetyData)
      }
    }

    // Test 6: Test hub customization
    console.log('\n6️⃣ Testing hub customization...')
    if (user) {
      const hubCustomization = {
        hub_theme: 'dark',
        hub_layout: 'masonry',
        hub_banner_url: 'https://example.com/banner.jpg',
        hub_description: 'Welcome to my custom hub!',
        custom_css: '.hub-header { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); }'
      }

      const { data: hubData, error: hubError } = await supabase
        .from('profiles')
        .update(hubCustomization)
        .eq('id', user.id)
        .select()

      if (hubError) {
        console.log('❌ Error updating hub customization:', hubError.message)
      } else {
        console.log('✅ Hub customization updated successfully:', hubData)
      }
    }

    console.log('\n🎉 Comprehensive profile testing completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Run the migration script if you haven\'t already')
    console.log('2. Update your UI components to use the new profile fields')
    console.log('3. Implement safety verification workflows')
    console.log('4. Add business account creation flows')
    console.log('5. Build hub customization interface')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Helper function to get table columns (if RPC exists)
async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Run the test
testComprehensiveProfiles()

