# App Icons Required for Production

## Status: ⚠️ ACTION REQUIRED

To complete app store submission, you need to create icon files from your logo.

## Location
Use the logo file: `public/pan logo transparent.png`

## Required Icon Sizes

### PWA & Web
Create these in `public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-180x180.png (Apple Touch Icon)
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### iOS App Store
- icon-1024x1024.png (App Store icon)

### Android Play Store
- icon-512x512.png (already in web icons)

## How to Create Icons

### Option 1: Use an Online Tool
1. Go to: https://realfavicongenerator.net/ or https://www.pwabuilder.com/
2. Upload: `public/pan logo transparent.png`
3. Download the generated icon pack
4. Place all icons in `public/icons/` folder

### Option 2: Use ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Then run:

convert "public/pan logo transparent.png" -resize 72x72 public/icons/icon-72x72.png
convert "public/pan logo transparent.png" -resize 96x96 public/icons/icon-96x96.png
convert "public/pan logo transparent.png" -resize 128x128 public/icons/icon-128x128.png
convert "public/pan logo transparent.png" -resize 144x144 public/icons/icon-144x144.png
convert "public/pan logo transparent.png" -resize 152x152 public/icons/icon-152x152.png
convert "public/pan logo transparent.png" -resize 180x180 public/icons/icon-180x180.png
convert "public/pan logo transparent.png" -resize 192x192 public/icons/icon-192x192.png
convert "public/pan logo transparent.png" -resize 384x384 public/icons/icon-384x384.png
convert "public/pan logo transparent.png" -resize 512x512 public/icons/icon-512x512.png
convert "public/pan logo transparent.png" -resize 1024x1024 public/icons/icon-1024x1024.png
```

### Option 3: Use Photoshop/Figma/Sketch
1. Open the logo
2. Export as PNG at each required size
3. Save to `public/icons/` with exact filenames above

## Splash Screens (iOS)

Create these for iOS app submission:
- splash-2048x2732.png (iPad Pro 12.9")
- splash-1668x2388.png (iPad Pro 11")
- splash-1536x2048.png (iPad)
- splash-1242x2688.png (iPhone 11 Pro Max, XS Max)
- splash-1125x2436.png (iPhone 11 Pro, X, XS)
- splash-828x1792.png (iPhone 11, XR)
- splash-750x1334.png (iPhone 8, 7, 6s)

## Additional Assets

### Open Graph Image
Create: `public/og-image.png` (1200x630px)
- Use for social media sharing
- Should show Pan branding and key features

### Screenshots
Create folder: `public/screenshots/`
- home.png (1280x720 or 1080x1920)
- hub.png
- messaging.png
- profile.png
- marketplace.png

Use these for app store listings and PWA installation prompts.

## After Creating Icons

1. Place all icons in `public/icons/` folder
2. Test PWA installation on mobile device
3. Verify icons appear correctly in:
   - Browser tabs
   - Mobile home screen
   - App switcher
   - Splash screen

## Need Help?

If you need assistance with icon generation, consider:
- Hiring a designer on Fiverr
- Using automated services like Appicon.co
- Using PWA Asset Generator: https://github.com/onderceylan/pwa-asset-generator

