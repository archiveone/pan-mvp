#!/usr/bin/env node

/**
 * Test Your Specific Buckets
 * 
 * This script tests your actual bucket setup to identify the exact issue.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testYourBuckets() {
  console.log('🔍 Testing Your Specific Bucket Setup...\n');
  
  // Your actual buckets
  const yourBuckets = [
    'pan-uploads',
    'content-images', 
    'media',
    'messages-media',
    'stories',
    'hub_box_items'
  ];
  
  // App-required buckets
  const requiredBuckets = ['content-images', 'media'];
  
  console.log('📦 Your current buckets:');
  for (const bucket of yourBuckets) {
    try {
      // Test if bucket exists and is accessible
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });
      
      if (error) {
        console.log(`❌ ${bucket} - Error: ${error.message}`);
      } else {
        console.log(`✅ ${bucket} - Accessible`);
      }
    } catch (err) {
      console.log(`❌ ${bucket} - Exception: ${err.message}`);
    }
  }
  
  console.log('\n🎯 Testing app-required buckets:');
  
  for (const bucket of requiredBuckets) {
    console.log(`\n🔍 Testing ${bucket}:`);
    
    try {
      // Test 1: List files (tests read access)
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });
      
      if (listError) {
        console.log(`  ❌ Read access failed: ${listError.message}`);
      } else {
        console.log(`  ✅ Read access works`);
      }
      
      // Test 2: Try to upload a small test file
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = 'Test upload';
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(`test/${testFileName}`, testContent, {
          contentType: 'text/plain',
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.log(`  ❌ Upload failed: ${uploadError.message}`);
      } else {
        console.log(`  ✅ Upload works`);
        
        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([`test/${testFileName}`]);
        
        if (deleteError) {
          console.log(`  ⚠️  Could not clean up test file: ${deleteError.message}`);
        } else {
          console.log(`  ✅ Cleanup successful`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
    }
  }
  
  console.log('\n🔧 If uploads are still failing, try:');
  console.log('1. Check RLS policies in Supabase Dashboard → Authentication → Policies');
  console.log('2. Ensure buckets are marked as PUBLIC');
  console.log('3. Check file size limits in bucket settings');
  console.log('4. Verify your .env.local has correct Supabase credentials');
}

// Run the test
testYourBuckets();
