#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if ImageMagick is available
const { execSync } = require('child_process');

function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function generateIcons() {
  const sourceLogo = 'public/pan logo transparent.png';
  const iconsDir = 'public/icons';
  const splashDir = 'public/splash';

  // Create directories if they don't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
  }

  // Check if source logo exists
  if (!fs.existsSync(sourceLogo)) {
    console.error('❌ Source logo not found:', sourceLogo);
    console.log('Please ensure "pan logo transparent.png" exists in the public folder');
    return;
  }

  // Check if ImageMagick is available
  if (!checkImageMagick()) {
    console.log('❌ ImageMagick not found. Please install it first:');
    console.log('Windows: https://imagemagick.org/script/download.php#windows');
    console.log('Mac: brew install imagemagick');
    console.log('Linux: sudo apt-get install imagemagick');
    return;
  }

  console.log('🎨 Generating app icons...');

  // Icon sizes for PWA and web
  const iconSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512, 1024];
  
  iconSizes.forEach(size => {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    try {
      execSync(`magick "${sourceLogo}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'ignore' });
      console.log(`✅ Created icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to create icon-${size}x${size}.png:`, error.message);
    }
  });

  // Splash screen sizes for iOS
  const splashSizes = [
    { name: '2048x2732', width: 2048, height: 2732 }, // iPad Pro 12.9"
    { name: '1668x2388', width: 1668, height: 2388 }, // iPad Pro 11"
    { name: '1536x2048', width: 1536, height: 2048 }, // iPad
    { name: '1242x2688', width: 1242, height: 2688 }, // iPhone 11 Pro Max, XS Max
    { name: '1125x2436', width: 1125, height: 2436 }, // iPhone 11 Pro, X, XS
    { name: '828x1792', width: 828, height: 1792 },   // iPhone 11, XR
    { name: '750x1334', width: 750, height: 1334 }    // iPhone 8, 7, 6s
  ];

  console.log('🎨 Generating splash screens...');
  
  splashSizes.forEach(splash => {
    const outputPath = path.join(splashDir, `splash-${splash.name}.png`);
    try {
      // Create splash screen with logo centered on white background
      execSync(`magick -size ${splash.width}x${splash.height} xc:white "${sourceLogo}" -gravity center -composite "${outputPath}"`, { stdio: 'ignore' });
      console.log(`✅ Created splash-${splash.name}.png`);
    } catch (error) {
      console.error(`❌ Failed to create splash-${splash.name}.png:`, error.message);
    }
  });

  // Create Open Graph image
  console.log('🎨 Creating Open Graph image...');
  try {
    execSync(`magick -size 1200x630 xc:white "${sourceLogo}" -gravity center -composite "public/og-image.png"`, { stdio: 'ignore' });
    console.log('✅ Created og-image.png');
  } catch (error) {
    console.error('❌ Failed to create og-image.png:', error.message);
  }

  console.log('\n🎉 Icon generation complete!');
  console.log('\nNext steps:');
  console.log('1. Test PWA installation on mobile device');
  console.log('2. Verify icons appear in browser tabs and home screen');
  console.log('3. Use icons for app store submissions');
}

// Run the script
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };
