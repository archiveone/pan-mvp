# ⚡ Quick Fix: Google Login Not Working on Live App

## What You Need

1. **Your production URL** (find it first!)
   - Vercel: Check your Vercel dashboard
   - Netlify: Check your Netlify dashboard
   - Example: `https://pan-marketplace.vercel.app`

2. **Your Supabase project ID**: `sjukjubqohkxqjoovqdw`

---

## 3-Step Fix (Takes 10 minutes)

### ✅ Step 1: Google Cloud Console (5 min)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth Client ID
3. Under **"Authorized redirect URIs"**, add:
   ```
   https://YOUR-PRODUCTION-URL/auth/callback
   ```
   Example: `https://pan-marketplace.vercel.app/auth/callback`
4. Click **SAVE**

### ✅ Step 2: Supabase Dashboard (3 min)

1. Go to: https://app.supabase.com/project/sjukjubqohkxqjoovqdw/auth/url-configuration
2. Scroll to **"Redirect URLs"**
3. Add:
   ```
   https://YOUR-PRODUCTION-URL/*
   https://YOUR-PRODUCTION-URL/auth/callback
   ```
4. Click **SAVE**

### ✅ Step 3: Check Environment Variables (2 min)

**If on Vercel:**
1. Go to your Vercel project → Settings → Environment Variables
2. Make sure these exist:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://sjukjubqohkxqjoovqdw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your key]
   ```
3. If you added/changed anything, **redeploy** the app

**If on Netlify:**
1. Go to Site settings → Environment variables
2. Same variables as above
3. Trigger new deploy if changed

---

## Test It! 🧪

1. **Wait 5-10 minutes** (Google changes take time to propagate)
2. Open **incognito/private window**
3. Go to: `https://YOUR-PRODUCTION-URL/login`
4. Click "Continue with Google"
5. Should work! ✅

---

## Still Not Working?

### Common Issues:

**Error: "redirect_uri_mismatch"**
- Copy the exact URI from error message
- Add it to Google Console
- Wait 10 minutes
- Try again

**Still redirects to localhost**
- Check if `NEXT_PUBLIC_SUPABASE_URL` is set in production
- Redeploy after setting env vars

**"Access blocked" error**
- In Google Console → OAuth consent screen
- Add your email to test users (if in Testing mode)

---

## Quick Reference

**Your Google Console:**
```
Authorized redirect URIs should include:
✅ http://localhost:3000/auth/callback (for dev)
✅ https://YOUR-DOMAIN/auth/callback (for production)
✅ https://sjukjubqohkxqjoovqdw.supabase.co/auth/v1/callback (Supabase)
```

**Your Supabase Redirect URLs:**
```
✅ http://localhost:3000/*
✅ http://localhost:3000/auth/callback
✅ https://YOUR-DOMAIN/*
✅ https://YOUR-DOMAIN/auth/callback
```

---

## That's It!

After these 3 steps, Google login will work on your live app! 🚀

For detailed troubleshooting, see: `🔧-GOOGLE-AUTH-PRODUCTION-FIX.md`

