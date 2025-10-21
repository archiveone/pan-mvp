# 🚀 Quick Deploy Guide - Get Live in 10 Minutes

## Option 1: Deploy to Vercel (Recommended - Easiest)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel --prod
```

That's it! Your site will be live at a vercel.app URL.

### Step 4: Add Environment Variables (After First Deploy)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

### Step 5: Redeploy
```bash
vercel --prod
```

---

## Option 2: Deploy to Netlify

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login
```bash
netlify login
```

### Step 3: Initialize
```bash
netlify init
```

### Step 4: Deploy
```bash
netlify deploy --prod
```

---

## Option 3: GitHub + Vercel (No CLI Needed)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/pan.git
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Click "Deploy"
5. Done! ✨

### Step 3: Add Environment Variables
In Vercel dashboard:
- Settings → Environment Variables
- Add your Supabase credentials
- Redeploy

---

## Common Issues & Solutions

### ❌ Build Error: "Module not found"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ❌ Environment Variables Not Working
**Solution:**
- Make sure they start with `NEXT_PUBLIC_` for client-side
- Redeploy after adding env vars
- Clear browser cache

### ❌ "output: standalone" Error
**Solution:** Remove this line from `next.config.js` if deploying to Vercel:
```js
// Remove or comment out:
// output: 'standalone',
```

### ❌ Supabase Connection Error
**Solution:**
1. Check your Supabase URL and key are correct
2. Make sure Supabase project is active
3. Check RLS policies in Supabase dashboard

### ❌ Build Takes Too Long / Times Out
**Solution:**
```bash
# In next.config.js, add:
experimental: {
  optimizePackageImports: ['lucide-react'],
}
```

---

## Quick Test Before Deploy

### 1. Test Build Locally
```bash
npm run build
npm run start
```

Visit http://localhost:3000 - everything should work!

### 2. Check for Errors
```bash
npm run lint
```

### 3. Type Check
```bash
npm run type-check
```

---

## After Deployment Checklist

- [ ] Site loads at deployment URL
- [ ] Can create an account
- [ ] Can create a post
- [ ] Images upload successfully
- [ ] Navigation works
- [ ] Mobile responsive
- [ ] PWA install prompt appears

---

## Custom Domain (Optional)

### Vercel:
1. Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. Wait 5-10 minutes for SSL

### Netlify:
1. Dashboard → Domain Settings
2. Add custom domain
3. Update DNS records
4. SSL auto-generated

---

## Need Help?

Tell me:
1. Which platform are you using?
2. What error message are you seeing?
3. At what step are you stuck?

I'll help you troubleshoot! 🛠️

