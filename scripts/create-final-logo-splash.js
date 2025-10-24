#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Creating Splash Screens with Final Pan Logo');
console.log('==============================================\n');

// Create directories
const iconsDir = 'public/icons';
const splashDir = 'public/splash';

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created icons directory');
}

if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
  console.log('✅ Created splash directory');
}

// Check if the final logo exists
const finalLogo = 'public/pan logo finalL.png';
if (!fs.existsSync(finalLogo)) {
  console.log('❌ Final logo not found:', finalLogo);
  console.log('Please ensure "pan logo finalL.png" exists in the public folder');
  return;
}

console.log('✅ Found final logo:', finalLogo);

// Create splash screens with the actual Pan logo
const createFinalLogoSplashSVG = (width, height) => {
  const logoSize = Math.min(width, height) * 0.4; // Logo takes 40% of smaller dimension
  
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000"/>
  
  <!-- Pan Logo - Slightly left and up -->
  <image href="pan logo finalL.png" 
         x="${(width - logoSize) / 2 - logoSize * 0.05}" 
         y="${(height - logoSize) / 2 - logoSize * 0.05}" 
         width="${logoSize}" 
         height="${logoSize}"
         style="filter: invert(1);"/>
  
  <!-- Optional: Add subtle background pattern -->
  <defs>
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1" fill="#ffffff" opacity="0.05"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#dots)"/>
</svg>`;
};

// Create app icon with the actual Pan logo
const createFinalLogoIconSVG = (size) => {
  const logoSize = size * 0.6; // Logo takes 60% of icon size
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000"/>
  
  <!-- Pan Logo - Slightly left and up -->
  <image href="pan logo finalL.png" 
         x="${(size - logoSize) / 2 - logoSize * 0.05}" 
         y="${(size - logoSize) / 2 - logoSize * 0.05}" 
         width="${logoSize}" 
         height="${logoSize}"
         style="filter: invert(1);"/>
</svg>`;
};

// iOS splash screen sizes
const iosSplashSizes = [
  { name: 'iPad Pro 12.9"', width: 2048, height: 2732 },
  { name: 'iPad Pro 11"', width: 1668, height: 2388 },
  { name: 'iPad', width: 1536, height: 2048 },
  { name: 'iPhone 11 Pro Max', width: 1242, height: 2688 },
  { name: 'iPhone 11 Pro', width: 1125, height: 2436 },
  { name: 'iPhone 11', width: 828, height: 1792 },
  { name: 'iPhone 8', width: 750, height: 1334 }
];

// App icon sizes
const iconSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512, 1024];

console.log('📱 Creating iOS splash screens with final Pan logo...');
iosSplashSizes.forEach(splash => {
  const filename = `splash-${splash.width}x${splash.height}`;
  
  // Create SVG version with actual logo
  const svgContent = createFinalLogoSplashSVG(splash.width, splash.height);
  fs.writeFileSync(path.join(splashDir, `${filename}.svg`), svgContent);
  
  console.log(`✅ Created ${filename} (${splash.name})`);
});

console.log('\n🎯 Creating app icons with final Pan logo...');
iconSizes.forEach(size => {
  const svgContent = createFinalLogoIconSVG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svgContent);
  console.log(`✅ Created icon-${size}x${size}.svg`);
});

// Create a black favicon with the actual logo
const faviconSVG = createFinalLogoIconSVG(32);
fs.writeFileSync('public/favicon-final-logo.svg', faviconSVG);

// Create a preview HTML file
const previewHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pan App - Final Logo Splash Screens</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .splash-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .splash-item {
            text-align: center;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background: #fafafa;
        }
        .splash-item svg {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .splash-item h3 {
            margin: 10px 0 5px 0;
            color: #333;
            font-size: 14px;
        }
        .splash-item p {
            margin: 0;
            color: #666;
            font-size: 12px;
        }
        .instructions {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .instructions h3 {
            margin-top: 0;
            color: #1976d2;
        }
        .status {
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #4caf50;
        }
        .logo-preview {
            background: #000;
            color: #fff;
            padding: 40px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            position: relative;
        }
        .logo-preview img {
            max-width: 200px;
            height: auto;
            filter: invert(1);
        }
        .logo-preview p {
            margin-top: 20px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Pan App - Final Logo Splash Screens</h1>
        
        <div class="status">
            ✅ Final logo splash screens created successfully!
        </div>
        
        <div class="logo-preview">
            <img src="pan logo finalL.png" alt="Pan Logo" style="max-width: 200px; height: auto; filter: invert(1);">
            <p>Your actual Pan logo inverted on black background</p>
        </div>
        
        <div class="instructions">
            <h3>📋 Next Steps</h3>
            <p><strong>To convert SVG to PNG for app stores:</strong></p>
            <ol>
                <li>Use online converter: <a href="https://convertio.co/svg-png/" target="_blank">Convertio.co</a></li>
                <li>Or use Inkscape (free): <a href="https://inkscape.org/" target="_blank">Download Inkscape</a></li>
                <li>Or use GIMP (free): <a href="https://www.gimp.org/" target="_blank">Download GIMP</a></li>
            </ol>
            <p><strong>For mobile app development:</strong> SVG files work great in Capacitor/Expo projects!</p>
        </div>

        <div class="section">
            <h2>📱 iOS Splash Screens</h2>
            <div class="splash-grid">
                ${iosSplashSizes.map(splash => `
                    <div class="splash-item">
                        <svg width="200" height="${Math.round(200 * splash.height / splash.width)}" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100%" height="100%" fill="#000000"/>
                            <image href="pan logo finalL.png" 
                                   x="${(200 - 80) / 2 - 4}" 
                                   y="${(Math.round(200 * splash.height / splash.width) - 80) / 2 - 4}" 
                                   width="80" height="80"
                                   style="filter: invert(1);"/>
                            <defs>
                                <pattern id="dots-${splash.width}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <circle cx="10" cy="10" r="0.5" fill="#ffffff" opacity="0.05"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#dots-${splash.width})"/>
                        </svg>
                        <h3>${splash.name}</h3>
                        <p>${splash.width}x${splash.height}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🎯 App Icons</h2>
            <div class="splash-grid">
                ${iconSizes.slice(0, 6).map(size => `
                    <div class="splash-item">
                        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100%" height="100%" fill="#000000"/>
                            <image href="pan logo finalL.png" 
                                   x="${(100 - 60) / 2 - 3}" 
                                   y="${(100 - 60) / 2 - 3}" 
                                   width="60" height="60"
                                   style="filter: invert(1);"/>
                        </svg>
                        <h3>${size}x${size}</h3>
                        <p>App Icon</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>📋 Files Created</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div>
                    <h3>iOS Splash Screens</h3>
                    <ul style="font-size: 14px; line-height: 1.6;">
                        ${iosSplashSizes.map(splash => `<li>splash-${splash.width}x${splash.height}.svg</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h3>App Icons</h3>
                    <ul style="font-size: 14px; line-height: 1.6;">
                        ${iconSizes.map(size => `<li>icon-${size}x${size}.svg</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🎨 Design Features</h2>
            <ul style="font-size: 14px; line-height: 1.6;">
                <li><strong>Black Background:</strong> #000000 for premium look</li>
                <li><strong>Actual Pan Logo:</strong> Your real logo inverted (white)</li>
                <li><strong>Perfect Scaling:</strong> Logo scales proportionally</li>
                <li><strong>Background Pattern:</strong> Subtle dots for texture</li>
                <li><strong>Professional:</strong> Matches your brand identity</li>
                <li><strong>Scalable:</strong> SVG format for crisp display</li>
                <li><strong>Consistent:</strong> Same logo across all sizes</li>
            </ul>
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync('public/final-logo-preview.html', previewHTML);

console.log('\n🎉 Final logo splash screens created successfully!');
console.log('\n📁 Files created:');
console.log('✅ iOS splash screens: public/splash/splash-*.svg');
console.log('✅ App icons: public/icons/icon-*.svg');
console.log('✅ Final logo favicon: public/favicon-final-logo.svg');
console.log('✅ Preview page: public/final-logo-preview.html');

console.log('\n🎯 Next Steps:');
console.log('1. Open: public/final-logo-preview.html to see your splash screens');
console.log('2. For app stores, convert SVG to PNG using online tools');
console.log('3. For mobile apps, SVG files work perfectly with Capacitor/Expo');
console.log('\n💡 Your actual Pan logo now appears on all splash screens!');
