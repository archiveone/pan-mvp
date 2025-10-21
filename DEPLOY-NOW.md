# 🚀 Deploy to Vercel - Run These Commands

## Step 1: Initialize Git (if not done)

```bash
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: **pan** (or your choice)
3. Keep it **Public** or **Private**
4. **DON'T** initialize with README
5. Click "Create repository"

## Step 3: Push to GitHub

Copy the commands GitHub shows you, or use these (replace YOUR_USERNAME):

```bash
git remote add origin https://github.com/YOUR_USERNAME/pan.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Sign in with GitHub (authorize if needed)
4. Select your **pan** repository
5. Click "Import"
6. Vercel will auto-detect Next.js settings
7. Click "Deploy"

## Step 5: Add Environment Variables

While deploying or after:

1. In Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add these:

```
NEXT_PUBLIC_SUPABASE_URL=https://sjukjubqohkxqjoovqdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

4. Select: Production, Preview, Development
5. Click Save

## Step 6: Redeploy (if you added env vars after first deploy)

```bash
git commit --allow-empty -m "Trigger redeploy with env vars"
git push
```

OR click "Redeploy" in Vercel dashboard

---

## 🎉 Done!

Your site will be live at: `https://your-project-name.vercel.app`

Every time you push to GitHub, it auto-deploys! 🚀

