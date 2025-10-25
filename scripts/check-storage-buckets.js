#!/usr/bin/env node

/**
 * Storage Buckets Checker
 * 
 * This script checks if your Supabase storage buckets exist
 * and provides instructions to fix any missing buckets.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables!');
  console.log('Please check your .env.local file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageBuckets() {
  console.log('🔍 Checking Supabase Storage Buckets...\n');
  
  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Error accessing storage:', error.message);
      return;
    }
    
    console.log('📦 Current buckets:');
    buckets.forEach(bucket => {
      console.log(`  • ${bucket.name} (public: ${bucket.public})`);
    });
    
    // Check required buckets
    const requiredBuckets = [
      'content-images',
      'media',
      'content-videos',
      'content-audio',
      'content-documents'
    ];
    
    console.log('\n🔍 Checking required buckets...');
    
    const missingBuckets = [];
    const existingBuckets = [];
    
    requiredBuckets.forEach(bucketName => {
      const exists = buckets.some(b => b.name === bucketName);
      if (exists) {
        existingBuckets.push(bucketName);
        console.log(`✅ ${bucketName} - EXISTS`);
      } else {
        missingBuckets.push(bucketName);
        console.log(`❌ ${bucketName} - MISSING`);
      }
    });
    
    if (missingBuckets.length === 0) {
      console.log('\n🎉 All required buckets exist! Uploads should work.');
    } else {
      console.log('\n⚠️  Missing buckets detected!');
      console.log('\n📋 TO FIX:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to Storage');
      console.log('3. Create the following buckets (make them PUBLIC):');
      
      missingBuckets.forEach(bucket => {
        console.log(`   • ${bucket}`);
      });
      
      console.log('\n🔧 OR run this SQL in your Supabase SQL Editor:');
      console.log('```sql');
      missingBuckets.forEach(bucket => {
        console.log(`INSERT INTO storage.buckets (id, name, public) VALUES ('${bucket}', '${bucket}', true) ON CONFLICT (id) DO NOTHING;`);
      });
      console.log('```');
    }
    
    // Check bucket policies
    console.log('\n🔒 Checking bucket policies...');
    
    for (const bucketName of existingBuckets) {
      try {
        // Try to list files in bucket to test access
        const { data: files, error: listError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
        
        if (listError) {
          console.log(`⚠️  ${bucketName} - Access issues: ${listError.message}`);
        } else {
          console.log(`✅ ${bucketName} - Accessible`);
        }
      } catch (err) {
        console.log(`❌ ${bucketName} - Error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error checking storage:', error.message);
  }
}

// Run the check
checkStorageBuckets();
