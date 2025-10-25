@echo off
REM 🚀 PAN - GitHub Deployment Script (Windows)
REM This script will push your code to GitHub

echo 🚀 PAN - GitHub Deployment Script
echo ==================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git branch -M main
) else (
    echo ✅ Git repository already initialized
)

REM Check for .env.local
if exist ".env.local" (
    echo ⚠️  Found .env.local - verifying it's in .gitignore...
    findstr /C:".env*.local" .gitignore >nul
    if errorlevel 1 (
        echo ❌ WARNING: .env.local is NOT in .gitignore!
        echo    Adding it now for security...
        echo .env*.local >> .gitignore
    ) else (
        echo ✅ .env.local is properly ignored
    )
)

REM Stage all files
echo.
echo 📁 Adding files to Git...
git add .

REM Show status
echo.
echo 📋 Files to be committed:
git status --short

REM Commit
echo.
echo 💾 Creating commit...
git commit -m "Deploy PAN - Complete Marketplace Platform" -m "Features: Reservations, Auctions, Fundraising, Streaming, E-commerce, Events, Rentals" -m "80+ database tables, 50+ services, 11 content types" -m "Industry-standard systems ready for production"

echo.
echo ✅ Commit created!
echo.

REM Ask for GitHub repository URL
echo 📝 Enter your GitHub repository URL:
echo    Example: https://github.com/yourusername/pan.git
set /p REPO_URL="   URL: "

if "%REPO_URL%"=="" (
    echo ❌ No URL provided. Please create a GitHub repo first:
    echo    1. Go to https://github.com/new
    echo    2. Name: pan
    echo    3. Make it Public
    echo    4. Don't initialize with README
    echo    5. Create repository
    echo    6. Copy the URL and run this script again
    pause
    exit /b 1
)

REM Add remote
echo.
echo 🔗 Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

REM Push to GitHub
echo.
echo 🚀 Pushing to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ Push failed. Common issues:
    echo    - Repository doesn't exist (create it first)
    echo    - Wrong URL (check GitHub)
    echo    - No access (check credentials)
    echo.
    echo Try creating the repository on GitHub first:
    echo https://github.com/new
    pause
) else (
    echo.
    echo 🎉 SUCCESS! Your code is on GitHub!
    echo.
    echo 📱 Next Steps:
    echo    1. Visit your repo
    echo    2. Deploy to Vercel: vercel --prod
    echo    3. Your app will be live!
    echo.
    echo ✨ You're ready to share PAN with the world!
    pause
)

