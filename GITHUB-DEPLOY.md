# 🚀 Deploy Pan via GitHub + Vercel

## Quick GitHub Setup (5 Minutes)

### Step 1: Initialize Git
```bash
git init
git add .
git commit -m "Initial commit - Pan social platform"
```

### Step 2: Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `pan` (or whatever you want)
3. Make it **Private** or **Public**
4. **Don't** initialize with README (you already have one)
5. Click "Create repository"

### Step 3: Push to GitHub
Copy the commands GitHub shows you (it will look like this):
```bash
git remote add origin https://github.com/YOUR-USERNAME/pan.git
git branch -M main
git push -u origin main
```

### Step 4: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Select your `pan` repo
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your-url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your-key
6. Click "Deploy"

### 🎉 DONE!

Your app will be live in ~2 minutes at: `https://pan-xxx.vercel.app`

---

## 🔥 Bonus: Auto-Deploy on Every Change!

Now whenever you make changes:
```bash
git add .
git commit -m "Update: description of changes"
git push
```

**Vercel automatically rebuilds and deploys!** 🔄

---

## 🎯 Why GitHub + Vercel?

- ✅ Auto-deploy on push
- ✅ Preview deployments for testing
- ✅ Rollback to any version
- ✅ Team collaboration
- ✅ Free hosting
- ✅ Custom domain support

---

**Start with Step 1 above and you'll be live in 5 minutes!** 🚀

