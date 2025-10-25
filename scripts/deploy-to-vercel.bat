@echo off
REM PAN App Deployment Script for Windows
REM Pushes changes to Git and deploys to Vercel

echo 🚀 PAN App Deployment Script
echo ==============================

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Not in a git repository. Please initialize git first.
    pause
    exit /b 1
)

REM Check if we have uncommitted changes
git status --porcelain > temp_status.txt
set /p HAS_CHANGES=<temp_status.txt
del temp_status.txt

if not "%HAS_CHANGES%"=="" (
    echo 📝 Staging all changes...
    git add .
    
    echo 💾 Committing changes...
    git commit -m "🚀 Deploy: Mobile UX fixes, header optimization, and storage bucket improvements
    
    - Fixed mobile hover boxes (one tap to see info, double tap to navigate)
    - Fixed trending tags overlapping and scrolling on mobile
    - Reduced header bar size while keeping logo perfectly centered
    - Added comprehensive audit system for automated testing
    - Fixed storage bucket permissions and upload issues
    - Improved mobile responsiveness across all components"
    
    echo ✅ Changes committed successfully!
) else (
    echo ℹ️  No changes to commit.
)

REM Check current branch
for /f %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 📍 Current branch: %CURRENT_BRANCH%

REM Push to origin
echo 📤 Pushing to GitHub...
git push origin %CURRENT_BRANCH%

if %errorlevel% equ 0 (
    echo ✅ Successfully pushed to GitHub!
) else (
    echo ❌ Failed to push to GitHub. Please check your git configuration.
    pause
    exit /b 1
)

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
vercel --prod

if %errorlevel% equ 0 (
    echo 🎉 Deployment successful!
    echo ==============================
    echo ✅ Changes pushed to GitHub
    echo ✅ App deployed to Vercel
    echo 🚀 Your PAN app is now live!
) else (
    echo ❌ Vercel deployment failed. Please check your Vercel configuration.
    pause
    exit /b 1
)

pause
