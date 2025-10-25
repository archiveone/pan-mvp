#!/bin/bash

# PAN App Deployment Script
# Pushes changes to Git and deploys to Vercel

echo "🚀 PAN App Deployment Script"
echo "=============================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please initialize git first."
    exit 1
fi

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Staging all changes..."
    git add .
    
    echo "💾 Committing changes..."
    git commit -m "🚀 Deploy: Mobile UX fixes, header optimization, and storage bucket improvements
    
    - Fixed mobile hover boxes (one tap to see info, double tap to navigate)
    - Fixed trending tags overlapping and scrolling on mobile
    - Reduced header bar size while keeping logo perfectly centered
    - Added comprehensive audit system for automated testing
    - Fixed storage bucket permissions and upload issues
    - Improved mobile responsiveness across all components"
    
    echo "✅ Changes committed successfully!"
else
    echo "ℹ️  No changes to commit."
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Push to origin
echo "📤 Pushing to GitHub..."
git push origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Failed to push to GitHub. Please check your git configuration."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "=============================="
    echo "✅ Changes pushed to GitHub"
    echo "✅ App deployed to Vercel"
    echo "🚀 Your PAN app is now live!"
else
    echo "❌ Vercel deployment failed. Please check your Vercel configuration."
    exit 1
fi
