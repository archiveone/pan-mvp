# 🔧 Configure Environment Variables for Your Live App

## 📍 Where is Your App Deployed?

Your app is live, which means it's hosted somewhere. Here's how to add environment variables depending on your platform:

---

## 🔷 Vercel (Most Common)

### **1. Find Your Project**
1. Go to [vercel.com](https://vercel.com)
2. Sign in
3. Find your "pan" project

### **2. Add Environment Variables**
1. Click your project
2. Go to **Settings** tab
3. Click **Environment Variables** (left sidebar)
4. Add these variables:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project-id.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: your-anon-key-here (it's a long JWT token)
```

### **3. Redeploy**
Two options:

**A. From Dashboard:**
- Go to **Deployments** tab
- Click **"Redeploy"** on the latest deployment

**B. From Terminal:**
```bash
vercel --prod
```

---

## 🟢 Netlify

### **1. Find Your Site**
1. Go to [app.netlify.com](https://app.netlify.com)
2. Sign in
3. Click your site

### **2. Add Environment Variables**
1. Go to **Site configuration**
2. Click **Environment variables**
3. Click **Add a variable**
4. Add both variables:

```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project-id.supabase.co

Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: your-anon-key-here
```

### **3. Trigger Redeploy**
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

---

## 🐙 GitHub Pages

If you're using GitHub Pages, you need to add a `.env.local` file (but **DON'T commit it**):

```bash
# Create locally
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key" >> .env.local

# Make sure .env.local is in .gitignore
echo ".env.local" >> .gitignore
```

Then rebuild and deploy.

---

## 🔑 Where to Get Your Supabase Credentials

### **Step 1: Go to Supabase Dashboard**
1. Visit [supabase.com](https://supabase.com)
2. Sign in (or create account if needed)
3. Open your project (or create one)

### **Step 2: Get Your Keys**
1. Click **Settings** (⚙️ icon in sidebar)
2. Click **API**
3. You'll see:
   - **Project URL** - This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Copy both and paste into your deployment platform!**

---

## 🗄️ Set Up Database (If You Haven't)

If you have Supabase credentials but no database:

### **1. Go to SQL Editor**
1. In Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New query**

### **2. Run Migrations (In Order)**
Run these SQL files one by one:

```sql
-- File: supabase/migrations/100_advanced_features.sql
-- Copy and paste entire file, then click "Run"

-- File: supabase/migrations/101_ultra_advanced_listings.sql
-- Run this next

-- File: supabase/migrations/106_auctions_and_fundraisers.sql
-- Run this

-- File: supabase/migrations/107_enterprise_auction_system.sql
-- Run this

-- File: supabase/migrations/108_industry_standard_bookings_reservations.sql
-- Run this last
```

**Location:** All migration files are in `supabase/migrations/` folder

---

## ✅ How to Verify It's Working

### **1. Check Environment Variables**

**Vercel:**
```bash
vercel env ls
```

**Netlify:**
Go to Site configuration → Environment variables

**Should see:**
```
NEXT_PUBLIC_SUPABASE_URL (visible)
NEXT_PUBLIC_SUPABASE_ANON_KEY (visible)
```

### **2. Check Your Live Site**

Open your live URL and:

1. **Open browser console** (F12)
2. **Run this:**
   ```javascript
   console.log(window.location.origin)
   console.log('Supabase configured:', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL))
   ```

3. **Check the page:**
   - **Demo mode:** Blue/purple banner at top
   - **Production mode:** No banner, real data

---

## 🚨 Troubleshooting

### **Issue: Banner Still Shows (Demo Mode)**

**Possible causes:**
1. Environment variables not saved
2. Site not redeployed after adding variables
3. Variables have wrong names (check spelling)

**Fix:**
1. Double-check variable names are **exact** (case-sensitive)
2. Redeploy your site
3. Clear browser cache (Ctrl+Shift+R)

### **Issue: "Invalid API Key" Error**

**Causes:**
- Supabase key is wrong or incomplete
- Key was copied with extra spaces

**Fix:**
1. Go back to Supabase Dashboard → Settings → API
2. Copy the **anon public** key again
3. Make sure you copy the **entire** key (it's ~200+ characters)
4. Paste it **without any spaces** before or after
5. Redeploy

### **Issue: Database Tables Missing**

**Fix:**
You need to run database migrations:
1. Go to Supabase → SQL Editor
2. Run all migration files (see above)

---

## 🎯 Quick Start Commands

### **If Deploying to Vercel:**
```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your key when prompted

# Redeploy
vercel --prod
```

### **If Deploying to Netlify:**
```bash
# Set environment variables
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-key-here"

# Redeploy
netlify deploy --prod
```

---

## 📱 What Happens After Configuration

### **Before (Demo Mode):**
- ❌ Can't sign in/sign up
- ❌ Can't create content
- ❌ Shows sample data only
- ✅ Browse and search works
- ✅ UI fully functional

### **After (Production Mode):**
- ✅ Full authentication
- ✅ Create posts, events, products
- ✅ User profiles
- ✅ Upload media
- ✅ Database storage
- ✅ Real-time updates
- ✅ All features enabled

---

## 💰 Supabase Free Tier

Don't worry about costs! Supabase free tier includes:
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ 2 GB bandwidth

**Perfect for getting started!**

---

## 📞 Need Help?

1. Check [DEMO-MODE-WORKING.md](DEMO-MODE-WORKING.md) for details
2. See [SETUP.md](SETUP.md) for full Supabase setup
3. Visit [Vercel Docs](https://vercel.com/docs/environment-variables) or [Netlify Docs](https://docs.netlify.com/environment-variables/overview/)

---

**Your app works great in demo mode, but adding these variables unlocks 100% functionality!** 🚀

