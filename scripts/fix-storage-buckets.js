#!/usr/bin/env node

/**
 * Storage Buckets Auto-Fix
 * 
 * This script automatically creates missing storage buckets
 * and sets up proper policies.
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

async function fixStorageBuckets() {
  console.log('🔧 Fixing Storage Buckets...\n');
  
  const requiredBuckets = [
    {
      name: 'content-images',
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    },
    {
      name: 'media',
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: null
    },
    {
      name: 'content-videos',
      public: true,
      fileSizeLimit: 104857600, // 100MB
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    },
    {
      name: 'content-audio',
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
    },
    {
      name: 'content-documents',
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }
  ];
  
  for (const bucketConfig of requiredBuckets) {
    try {
      console.log(`🔍 Checking bucket: ${bucketConfig.name}`);
      
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.log(`❌ Error checking buckets: ${listError.message}`);
        continue;
      }
      
      const bucketExists = buckets.some(b => b.name === bucketConfig.name);
      
      if (bucketExists) {
        console.log(`✅ ${bucketConfig.name} - Already exists`);
      } else {
        console.log(`🔧 Creating bucket: ${bucketConfig.name}`);
        
        const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public,
          allowedMimeTypes: bucketConfig.allowedMimeTypes,
          fileSizeLimit: bucketConfig.fileSizeLimit
        });
        
        if (error) {
          console.log(`❌ Failed to create ${bucketConfig.name}: ${error.message}`);
        } else {
          console.log(`✅ Created bucket: ${bucketConfig.name}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error with ${bucketConfig.name}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Storage buckets check complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Go to your Supabase Dashboard → Storage');
  console.log('2. Verify all buckets are marked as PUBLIC');
  console.log('3. Try uploading a file to test');
}

// Run the fix
fixStorageBuckets();
