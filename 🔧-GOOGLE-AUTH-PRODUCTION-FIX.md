# 🔧 Google Auth Production Fix

## Problem
Google login works locally but **NOT on the live app** (production).

## Root Cause
Your production domain URLs are not whitelisted in:
1. ❌ Google Cloud Console
2. ❌ Supabase Authentication settings
3. ❌ Environment variables might not be set

---

## ✅ Complete Fix - Step by Step

### Step 1: Find Your Production URL

**Where is your app deployed?**
- Vercel: `https://yourapp.vercel.app`
- Netlify: `https://yourapp.netlify.app`
- Custom domain: `https://yourdomain.com`

Let's call this `YOUR_PRODUCTION_URL`

---

### Step 2: Update Google Cloud Console

#### A. Go to Google Cloud Console:
```
https://console.cloud.google.com/apis/credentials
```

#### B. Click on your OAuth Client ID (the one you created for Pan)

#### C. Update **Authorized JavaScript origins:**

**Add your production URL:**
```
https://YOUR_PRODUCTION_URL
```

Example:
```
https://pan-marketplace.vercel.app
```

#### D. Update **Authorized redirect URIs:**

**Add BOTH of these:**
```
https://YOUR_PRODUCTION_URL/auth/callback
https://sjukjubqohkxqjoovqdw.supabase.co/auth/v1/callback
```

**Your full list should look like:**
```
http://localhost:3000/auth/callback (for local dev)
https://YOUR_PRODUCTION_URL/auth/callback (for production)
https://sjukjubqohkxqjoovqdw.supabase.co/auth/v1/callback (Supabase)
```

#### E. Click **SAVE**

⚠️ **Important:** Changes can take 5-10 minutes to propagate!

---

### Step 3: Update Supabase Settings

#### A. Go to Supabase Dashboard:
```
https://app.supabase.com/project/sjukjubqohkxqjoovqdw/auth/url-configuration
```

#### B. Add to **Redirect URLs** (Site URL section):

**Add these URLs:**
```
https://YOUR_PRODUCTION_URL/*
https://YOUR_PRODUCTION_URL/auth/callback
```

Example:
```
https://pan-marketplace.vercel.app/*
https://pan-marketplace.vercel.app/auth/callback
```

**Your full list should include:**
```
http://localhost:3000/* (for local dev)
http://localhost:3000/auth/callback
https://YOUR_PRODUCTION_URL/*
https://YOUR_PRODUCTION_URL/auth/callback
```

#### C. Click **SAVE**

---

### Step 4: Set Environment Variables in Production

**If deployed on Vercel:**

1. Go to your Vercel dashboard:
   ```
   https://vercel.com/dashboard
   ```

2. Select your project

3. Go to **Settings** → **Environment Variables**

4. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://sjukjubqohkxqjoovqdw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key]
   NEXT_PUBLIC_SITE_URL = https://YOUR_PRODUCTION_URL
   ```

5. **Important:** After adding variables, **REDEPLOY** your app!
   - Go to **Deployments** tab
   - Click **...** on latest deployment
   - Click **Redeploy**

**If deployed on Netlify:**

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add the same variables as above
5. **Trigger new deploy**

---

### Step 5: Update Auth Service (Optional but Recommended)

Update `services/authService.ts` to use environment variable:

```typescript
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    // Use environment variable for site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to sign in with Google'
    };
  }
}
```

---

## 🧪 Testing

### 1. Clear Browser Cache
- Use incognito/private window
- Or clear cookies for your production site

### 2. Go to Your Live App
```
https://YOUR_PRODUCTION_URL/login
```

### 3. Click "Continue with Google"

### 4. Expected Flow:
```
Your app → Google login → Select account → Redirect to your app → Logged in! ✅
```

---

## 🐛 Troubleshooting

### Error: "Redirect URI mismatch"

**Console shows:**
```
Error 400: redirect_uri_mismatch
```

**Fix:**
1. Copy the **exact** redirect URI from the error message
2. Add it to Google Cloud Console → Authorized redirect URIs
3. Wait 5-10 minutes
4. Try again

### Error: "Access blocked: This app's request is invalid"

**Fix:**
1. Make sure Google OAuth consent screen is published
2. In Google Console → **OAuth consent screen**
3. If in "Testing" mode, add your email to test users
4. Or publish the app

### Error: Still redirects to localhost

**Fix:**
1. Check environment variable: `NEXT_PUBLIC_SITE_URL`
2. Make sure it's set in your production hosting (Vercel/Netlify)
3. Redeploy after setting

### Error: "No session found" on production

**Check browser console (F12):**
- Look for CORS errors
- Check if Supabase redirect URLs include your domain

**Fix:**
1. Verify Supabase redirect URLs include production domain
2. Check that NEXT_PUBLIC_SUPABASE_URL is set correctly
3. Try clearing browser cookies

---

## ✅ Quick Checklist

Before testing, make sure:

- [ ] Production URL added to Google Console (JavaScript origins)
- [ ] Production callback URL added to Google Console (redirect URIs)
- [ ] Supabase callback URL still in Google Console
- [ ] Production URLs added to Supabase redirect URLs
- [ ] Environment variables set in production hosting
- [ ] App redeployed after setting environment variables
- [ ] Waited 5-10 minutes after Google Console changes
- [ ] Testing in incognito/private window

---

## 📱 Example Configuration

**If your app is at:** `https://pan-app.vercel.app`

### Google Console - Authorized JavaScript origins:
```
http://localhost:3000
https://pan-app.vercel.app
```

### Google Console - Authorized redirect URIs:
```
http://localhost:3000/auth/callback
https://pan-app.vercel.app/auth/callback
https://sjukjubqohkxqjoovqdw.supabase.co/auth/v1/callback
```

### Supabase - Redirect URLs:
```
http://localhost:3000/*
http://localhost:3000/auth/callback
https://pan-app.vercel.app/*
https://pan-app.vercel.app/auth/callback
```

### Vercel Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://sjukjubqohkxqjoovqdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=https://pan-app.vercel.app
```

---

## 🎯 Most Common Issues

### 1. Forgot to add production URL to Google Console (90% of cases)
**Fix:** Add `https://YOUR_DOMAIN/auth/callback` to Google Console

### 2. Environment variables not set in production
**Fix:** Add `NEXT_PUBLIC_SITE_URL` to Vercel/Netlify and redeploy

### 3. Didn't wait for Google changes to propagate
**Fix:** Wait 10 minutes after saving Google Console changes

### 4. Using localhost URL in production
**Fix:** Set `NEXT_PUBLIC_SITE_URL` environment variable

---

## 🚀 After Fix

Once everything is configured:

✅ Google login works on production
✅ Users can sign in from anywhere
✅ Session persists correctly
✅ Redirects to your app (not localhost)

---

## 💡 Pro Tip

**For custom domains:**

If you have a custom domain (e.g., `yourapp.com`), you need to add BOTH:
- Your Vercel URL: `https://yourapp.vercel.app`
- Your custom domain: `https://yourapp.com`

Add both to Google Console AND Supabase redirect URLs.

---

## 📞 Still Not Working?

1. **Check browser console (F12)** - look for specific error messages
2. **Check Network tab** - see if requests are being made to correct URLs
3. **Verify environment variables** - make sure they're actually set in production
4. **Test the Supabase callback directly:**
   ```
   https://sjukjubqohkxqjoovqdw.supabase.co/auth/v1/authorize?provider=google
   ```

If you see specific error messages, share them and I can help debug further!

---

## ✨ Success!

After following these steps, your Google login will work perfectly on production! 🎉

Users can now sign in from anywhere in the world! 🌍


