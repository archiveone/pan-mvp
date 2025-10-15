# 🚀 Pan - Complete Deployment Guide

## Overview
This guide walks you through deploying Pan to production and submitting to app stores.

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Supabase account and project
- [ ] Vercel account (free tier works)
- [ ] Domain name (optional)
- [ ] Apple Developer Account ($99/year) for iOS
- [ ] Google Play Console ($25 one-time) for Android

---

## Part 1: Web Deployment (Vercel)

### Step 1: Prepare Environment

Create `.env.local` file:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### Step 2: Test Production Build

```bash
# Build the app
npm run build

# Test production build locally
npm run start
```

Visit `http://localhost:3000` and test all features.

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

Follow the prompts:
- Link to existing project? **No** (first time)
- Project name? **pan** (or your choice)
- Directory? **./\** (press Enter)
- Override settings? **No** (press Enter)

### Step 4: Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from `.env.local`
5. Select all environments (Production, Preview, Development)
6. Click **Save**

### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

### Step 6: Add Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your domain (e.g., pan.app)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## Part 2: Database Setup (Supabase)

### Step 1: Run Migrations

1. Go to Supabase Dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run each migration file in order:

```sql
-- Run files from supabase/migrations/ in order
-- Start with the earliest date
```

### Step 2: Verify Tables

Check these tables exist:
- profiles
- content
- messages
- conversations
- notifications
- saved_items
- hub_boxes
- followers

### Step 3: Enable Realtime (if needed)

1. Go to **Database** → **Replication**
2. Enable realtime for:
   - messages
   - notifications
   - conversations

### Step 4: Storage Buckets

Create these storage buckets:
- **avatars** (public)
- **media** (public)
- **private-files** (private)

Set up storage policies for each bucket.

---

## Part 3: Create App Icons & Assets

### Required Icons

Using your logo (`public/pan logo transparent.png`):

#### Method 1: Online Tool (Easiest)
1. Visit https://realfavicongenerator.net/
2. Upload your logo
3. Download generated pack
4. Extract to `public/icons/`

#### Method 2: ImageMagick (if installed)
```bash
# Create icons directory
mkdir -p public/icons

# Generate all sizes
for size in 72 96 128 144 152 180 192 384 512 1024; do
  convert "public/pan logo transparent.png" -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done
```

### Required Splash Screens (iOS)

Create these in `public/splash/`:
- splash-2048x2732.png (iPad Pro 12.9")
- splash-1668x2388.png (iPad Pro 11")
- splash-1536x2048.png (iPad)
- splash-1242x2688.png (iPhone Pro Max)
- splash-1125x2436.png (iPhone Pro)
- splash-828x1792.png (iPhone)
- splash-750x1334.png (iPhone SE)

### Screenshots for App Stores

Take screenshots of:
1. Homepage feed
2. Personal hub
3. Messaging interface
4. Profile page
5. Marketplace listing

Required sizes:
- **iOS**: 1284x2778 (iPhone), 2048x2732 (iPad)
- **Android**: 1080x1920 minimum

---

## Part 4: Mobile App Build

### Option A: Progressive Web App (PWA) - Easiest

Your app is already PWA-ready! Users can install from browser:

**iOS Safari:**
1. Tap Share button
2. "Add to Home Screen"

**Android Chrome:**
1. Menu → "Install app"

### Option B: Native App with Capacitor

#### Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

#### Initialize Capacitor

```bash
npx cap init Pan com.yourcompany.pan
```

Update `capacitor.config.json`:
```json
{
  "appId": "com.yourcompany.pan",
  "appName": "Pan",
  "webDir": "out",
  "server": {
    "url": "https://your-domain.com",
    "cleartext": true
  }
}
```

#### Add Platforms

```bash
# Add iOS
npx cap add ios

# Add Android
npx cap add android
```

#### Build & Deploy

```bash
# Build Next.js app
npm run build

# Export static files
# Add to package.json: "export": "next export"
npm run export

# Copy to native projects
npx cap copy

# Open in Xcode (macOS only)
npx cap open ios

# Open in Android Studio
npx cap open android
```

---

## Part 5: iOS App Store Submission

### Prerequisites
- macOS computer
- Xcode installed
- Apple Developer Account ($99/year)

### Step 1: Xcode Configuration

1. Open project in Xcode: `npx cap open ios`
2. Select project in navigator
3. Update **General** tab:
   - Display Name: **Pan**
   - Bundle Identifier: **com.yourcompany.pan**
   - Version: **1.0.0**
   - Build: **1**

### Step 2: Add App Icons

1. Open `Assets.xcassets`
2. Select **AppIcon**
3. Drag icons to appropriate slots

### Step 3: Add Launch Screen

1. Create launch screen in Xcode
2. Use your logo and brand colors

### Step 4: Configure Capabilities

Enable these capabilities:
- Push Notifications
- Background Modes → Remote notifications
- Sign in with Apple (if using)

### Step 5: App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in details:
   - Name: **Pan**
   - Primary Language: **English**
   - Bundle ID: **com.yourcompany.pan**
   - SKU: **pan-001**

### Step 6: App Information

Fill out:
- **Description** (see APP-STORE-CHECKLIST.md)
- **Keywords**: social, marketplace, community, messaging
- **Screenshots**: Upload for iPhone and iPad
- **Privacy Policy URL**: https://your-domain.com/privacy
- **Category**: Social Networking
- **Age Rating**: 12+

### Step 7: Build & Upload

In Xcode:
1. Select **Any iOS Device** as destination
2. **Product** → **Archive**
3. **Distribute App** → **App Store Connect**
4. Select your account
5. Upload

### Step 8: Submit for Review

1. Select build in App Store Connect
2. Complete all sections
3. **Submit for Review**
4. Wait 1-7 days for approval

---

## Part 6: Google Play Store Submission

### Prerequisites
- Android Studio installed
- Google Play Console account ($25 one-time)

### Step 1: Android Studio Configuration

1. Open in Android Studio: `npx cap open android`
2. Update `app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.yourcompany.pan"
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Step 2: Generate Signing Key

```bash
keytool -genkey -v -keystore pan-release.keystore -alias pan -keyalg RSA -keysize 2048 -validity 10000
```

Save keystore securely!

### Step 3: Configure Signing

Create `android/key.properties`:
```properties
storePassword=your-password
keyPassword=your-password
keyAlias=pan
storeFile=../pan-release.keystore
```

Update `app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Step 4: Build Release APK/Bundle

```bash
cd android
./gradlew bundleRelease
```

Find build at: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 5: Play Console Setup

1. Go to https://play.google.com/console
2. **Create app**
3. Fill in details:
   - App name: **Pan**
   - Default language: **English**
   - Category: **Social**

### Step 6: Store Listing

Fill out:
- **Short description** (80 chars)
- **Full description** (see APP-STORE-CHECKLIST.md)
- **Screenshots**: Upload for Phone and Tablet
- **Feature graphic**: 1024x500 PNG
- **Privacy Policy**: https://your-domain.com/privacy

### Step 7: Content Rating

1. Complete questionnaire
2. Get rating

### Step 8: Release

1. **Production** → **Create new release**
2. Upload `app-release.aab`
3. Add release notes
4. **Review release**
5. **Start rollout to Production**

---

## Part 7: Post-Launch

### Monitoring

Set up monitoring:
- Google Analytics
- Sentry for error tracking
- Vercel Analytics

### Updates

When updating:
1. Increment version in `package.json`
2. Update version in app configs
3. Deploy to Vercel
4. Build new app version
5. Submit to stores

### Marketing

- Submit to app review sites
- Create social media accounts
- Post on Product Hunt
- Reach out to tech bloggers

---

## Troubleshooting

### Build Fails
- Check Node version (18+)
- Clear `.next` and `node_modules`
- Run `npm install` again

### Environment Variables Not Working
- Prefix with `NEXT_PUBLIC_`
- Redeploy after adding to Vercel
- Clear browser cache

### iOS Build Issues
- Update Xcode to latest
- Clean build folder
- Delete derived data

### Android Build Issues
- Update Android Studio
- Sync Gradle files
- Invalidate caches

---

## Support

If you need help:
- Check documentation
- Search GitHub issues
- Ask in community forum
- Contact support

---

## Checklist

- [ ] Web deployed to Vercel
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Icons created
- [ ] Screenshots taken
- [ ] iOS app built
- [ ] Android app built
- [ ] App Store listing complete
- [ ] Play Store listing complete
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] Analytics configured
- [ ] Submitted for review

---

## 🎉 Congratulations!

You've successfully deployed Pan to production and submitted to app stores!

**Timeline:**
- Web deployment: 30 minutes
- App builds: 2-4 hours
- Store setup: 2-3 hours
- Review process: 1-7 days

**Next Steps:**
- Monitor analytics
- Respond to user feedback
- Plan feature updates
- Grow your user base

Good luck! 🚀

