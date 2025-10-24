#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Pan Mobile App for App Store & Play Store');
console.log('====================================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Check if Capacitor is installed
function checkCapacitor() {
  try {
    execSync('npx cap --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Install required dependencies
function installDependencies() {
  console.log('📦 Installing mobile app dependencies...');
  
  const dependencies = [
    '@capacitor/core',
    '@capacitor/cli',
    '@capacitor/ios',
    '@capacitor/android',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
    '@capacitor/keyboard',
    '@capacitor/push-notifications',
    '@capacitor/local-notifications'
  ];

  try {
    execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Initialize Capacitor
function initializeCapacitor() {
  console.log('🔧 Initializing Capacitor...');
  
  try {
    // Check if capacitor.config.json exists
    if (!fs.existsSync('capacitor.config.json')) {
      execSync('npx cap init "Pan" "com.pan.app"', { stdio: 'inherit' });
    }
    
    // Add platforms
    if (!fs.existsSync('ios')) {
      console.log('📱 Adding iOS platform...');
      execSync('npx cap add ios', { stdio: 'inherit' });
    }
    
    if (!fs.existsSync('android')) {
      console.log('🤖 Adding Android platform...');
      execSync('npx cap add android', { stdio: 'inherit' });
    }
    
    console.log('✅ Capacitor initialized successfully\n');
  } catch (error) {
    console.error('❌ Failed to initialize Capacitor:', error.message);
    process.exit(1);
  }
}

// Build Next.js app
function buildNextApp() {
  console.log('🏗️ Building Next.js application...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Next.js build completed successfully\n');
  } catch (error) {
    console.error('❌ Next.js build failed:', error.message);
    process.exit(1);
  }
}

// Copy web assets to native projects
function copyAssets() {
  console.log('📋 Copying web assets to native projects...');
  
  try {
    execSync('npx cap copy', { stdio: 'inherit' });
    console.log('✅ Assets copied successfully\n');
  } catch (error) {
    console.error('❌ Failed to copy assets:', error.message);
    process.exit(1);
  }
}

// Update Capacitor configuration
function updateCapacitorConfig() {
  console.log('⚙️ Updating Capacitor configuration...');
  
  const config = {
    appId: "com.pan.app",
    appName: "Pan",
    webDir: "out",
    bundledWebRuntime: false,
    backgroundColor: "#ffffff",
    server: {
      androidScheme: "https",
      iosScheme: "https",
      hostname: "pan.app"
    },
    plugins: {
      SplashScreen: {
        launchShowDuration: 2000,
        launchAutoHide: true,
        backgroundColor: "#ffffff",
        androidSplashResourceName: "splash",
        androidScaleType: "CENTER_CROP",
        showSpinner: false,
        androidSpinnerStyle: "large",
        iosSpinnerStyle: "small",
        spinnerColor: "#000000",
        splashFullScreen: true,
        splashImmersive: true
      },
      StatusBar: {
        style: "dark",
        backgroundColor: "#ffffff"
      },
      Keyboard: {
        resize: "body",
        style: "dark",
        resizeOnFullScreen: true
      },
      PushNotifications: {
        presentationOptions: ["badge", "sound", "alert"]
      },
      LocalNotifications: {
        smallIcon: "ic_stat_icon_config_sample",
        iconColor: "#000000",
        sound: "beep.wav"
      }
    },
    cordova: {},
    ios: {
      contentInset: "automatic",
      limitsNavigationsToAppBoundDomains: true
    },
    android: {
      buildOptions: {
        keystorePath: "",
        keystorePassword: "",
        keystoreAlias: "",
        keystoreAliasPassword: "",
        releaseType: "APK"
      },
      allowMixedContent: false,
      captureInput: true,
      webContentsDebuggingEnabled: false
    }
  };

  fs.writeFileSync('capacitor.config.json', JSON.stringify(config, null, 2));
  console.log('✅ Capacitor configuration updated\n');
}

// Create iOS build
function buildIOS() {
  console.log('🍎 Building iOS app...');
  console.log('📱 Opening Xcode for iOS build...');
  
  try {
    execSync('npx cap open ios', { stdio: 'inherit' });
    console.log('\n✅ Xcode opened successfully!');
    console.log('\n📋 iOS Build Instructions:');
    console.log('1. In Xcode, select your development team');
    console.log('2. Choose your target device or simulator');
    console.log('3. Click the "Build" button (⌘+B)');
    console.log('4. For App Store: Product → Archive → Distribute App');
    console.log('5. Follow the App Store Connect upload process\n');
  } catch (error) {
    console.error('❌ Failed to open Xcode:', error.message);
    console.log('💡 Make sure Xcode is installed on your Mac');
  }
}

// Create Android build
function buildAndroid() {
  console.log('🤖 Building Android app...');
  console.log('📱 Opening Android Studio for Android build...');
  
  try {
    execSync('npx cap open android', { stdio: 'inherit' });
    console.log('\n✅ Android Studio opened successfully!');
    console.log('\n📋 Android Build Instructions:');
    console.log('1. In Android Studio, wait for Gradle sync to complete');
    console.log('2. Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"');
    console.log('3. For Play Store: Build → Generate Signed Bundle / APK');
    console.log('4. Choose "Android App Bundle" for Play Store');
    console.log('5. Follow the Play Console upload process\n');
  } catch (error) {
    console.error('❌ Failed to open Android Studio:', error.message);
    console.log('💡 Make sure Android Studio is installed');
  }
}

// Create app store assets checklist
function createAssetsChecklist() {
  console.log('📋 Creating App Store Assets Checklist...');
  
  const checklist = `# App Store Assets Checklist

## Required Icons
- [ ] App icon 1024x1024 (iOS App Store)
- [ ] App icon 512x512 (Google Play Store)
- [ ] All PWA icons (72x72 to 512x512)

## Required Screenshots
### iOS App Store
- [ ] iPhone 6.7" (1290 x 2796): 3-10 screenshots
- [ ] iPhone 6.5" (1242 x 2688): 3-10 screenshots  
- [ ] iPhone 5.5" (1242 x 2208): 3-10 screenshots
- [ ] iPad Pro (2048 x 2732): 3-10 screenshots

### Google Play Store
- [ ] Phone (1080 x 1920): 2-8 screenshots
- [ ] Tablet (1200 x 1920): 1-8 screenshots
- [ ] Feature Graphic (1024 x 500): 1 required

## Marketing Assets
- [ ] App Store Preview Video (optional)
- [ ] Feature Graphic for Play Store
- [ ] Promotional images

## Legal Pages (Must be live)
- [ ] Privacy Policy: /privacy
- [ ] Terms of Service: /terms
- [ ] Support Page: /support

## Store Listings
- [ ] App descriptions written
- [ ] Keywords selected
- [ ] Age ratings determined
- [ ] Categories chosen
- [ ] Pricing set

## Testing
- [ ] Test on real iOS devices
- [ ] Test on real Android devices
- [ ] Test all core features
- [ ] Test payment flows
- [ ] Test push notifications
- [ ] Test offline functionality

## Developer Accounts
- [ ] Apple Developer Account ($99/year)
- [ ] Google Play Console ($25 one-time)
- [ ] Payment methods added
- [ ] Tax information completed

## Final Steps
- [ ] Upload builds to stores
- [ ] Complete store listings
- [ ] Submit for review
- [ ] Monitor review process
- [ ] Respond to feedback if needed
`;

  fs.writeFileSync('APP-STORE-ASSETS-CHECKLIST.md', checklist);
  console.log('✅ Assets checklist created: APP-STORE-ASSETS-CHECKLIST.md\n');
}

// Main build process
async function buildMobileApp() {
  try {
    // Check if Capacitor is available
    if (!checkCapacitor()) {
      console.log('📦 Capacitor not found, installing dependencies...');
      installDependencies();
    }

    // Initialize Capacitor
    initializeCapacitor();

    // Update configuration
    updateCapacitorConfig();

    // Build Next.js app
    buildNextApp();

    // Copy assets
    copyAssets();

    // Create assets checklist
    createAssetsChecklist();

    // Open native IDEs
    console.log('🎯 Next Steps:');
    console.log('1. Create all required app icons and screenshots');
    console.log('2. Set up Apple Developer Account and Google Play Console');
    console.log('3. Build and test on real devices');
    console.log('4. Complete store listings');
    console.log('5. Submit for review\n');

    // Ask user which platform to build
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Which platform would you like to build first? (ios/android/both): ', (answer) => {
      if (answer.toLowerCase().includes('ios') || answer.toLowerCase().includes('both')) {
        buildIOS();
      }
      
      if (answer.toLowerCase().includes('android') || answer.toLowerCase().includes('both')) {
        buildAndroid();
      }
      
      rl.close();
    });

  } catch (error) {
    console.error('❌ Build process failed:', error.message);
    process.exit(1);
  }
}

// Run the build process
if (require.main === module) {
  buildMobileApp();
}

module.exports = { buildMobileApp };
