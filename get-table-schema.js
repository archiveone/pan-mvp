// Get the schema of existing tables
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getTableSchema() {
  try {
    console.log('🔍 Getting table schemas...\n')

    // Get profiles table schema by trying to insert and see what fields are expected
    console.log('📋 Profiles table structure:')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      if (!error) {
        console.log('✅ Profiles table accessible')
        // Try to get column info by attempting a select with specific columns
        const testColumns = ['id', 'email', 'username', 'full_name', 'avatar_url', 'created_at', 'updated_at', 'bio', 'website', 'location']
        for (const col of testColumns) {
          try {
            const { error: colError } = await supabase
              .from('profiles')
              .select(col)
              .limit(1)
            if (!colError) {
              console.log(`  - ${col}: exists`)
            }
          } catch (e) {
            // Column doesn't exist
          }
        }
      }
    } catch (err) {
      console.log('Error checking profiles:', err.message)
    }

    console.log('\n📋 Posts table structure:')
    try {
      const testColumns = ['id', 'title', 'content', 'description', 'price', 'location', 'category', 'image_url', 'user_id', 'created_at', 'updated_at', 'published', 'sold']
      for (const col of testColumns) {
        try {
          const { error: colError } = await supabase
            .from('posts')
            .select(col)
            .limit(1)
          if (!colError) {
            console.log(`  - ${col}: exists`)
          }
        } catch (e) {
          // Column doesn't exist
        }
      }
    } catch (err) {
      console.log('Error checking posts:', err.message)
    }

    // Let's try a different approach - attempt to get table info
    console.log('\n🔍 Attempting to get table information...')
    
    // Try to insert a test record to see what fields are required/available
    console.log('\nTesting posts table insert (will fail but show structure):')
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          title: 'test',
          content: 'test'
        }])
        .select()
      
      if (error) {
        console.log('Insert error (expected):', error.message)
        // This will tell us about the table structure
      }
    } catch (err) {
      console.log('Insert test error:', err.message)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

getTableSchema()

