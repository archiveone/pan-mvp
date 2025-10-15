# 🔧 Google Authentication Fix Guide

## Problem
Google login not working - likely due to missing Supabase configuration.

## ✅ Solution - Step by Step

### 1. Configure Google OAuth in Supabase

#### Go to Supabase Dashboard:
```
https://app.supabase.com
→ Your Project
→ Authentication
→ Providers
→ Google
```

#### Enable Google Provider:
1. Toggle **"Enable Google Provider"** to ON
2. You'll need **Google OAuth Credentials**

---

### 2. Create Google OAuth Credentials

#### A. Go to Google Cloud Console:
```
https://console.cloud.google.com
```

#### B. Create a New Project (or select existing):
1. Click project dropdown → **New Project**
2. Name it: `Pan Social Platform`
3. Click **Create**

#### C. Enable Google+ API:
1. Go to **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click **Enable**

#### D. Create OAuth Credentials:
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - User Type: **External**
   - App name: **Pan**
   - User support email: Your email
   - Developer email: Your email
   - Click **Save and Continue**
   - Skip scopes, test users for now
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Pan Web App**
   
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
   https://yourdomain.com/auth/callback
   ```
   
   **Important:** Replace `<YOUR-SUPABASE-PROJECT-REF>` with your actual Supabase project reference (found in Supabase project settings)

7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

---

### 3. Add Credentials to Supabase

#### Back in Supabase Dashboard:
1. **Authentication** → **Providers** → **Google**
2. Paste:
   - **Client ID** (from Google Console)
   - **Client Secret** (from Google Console)
3. Copy the **Callback URL** shown in Supabase
4. Click **Save**

---

### 4. Whitelist Redirect URLs in Supabase

#### Go to Supabase Authentication Settings:
```
Supabase Dashboard
→ Authentication
→ URL Configuration
```

#### Add to **Redirect URLs**:
```
http://localhost:3000/auth/callback
http://localhost:3000/
https://yourdomain.com/auth/callback
https://yourdomain.com/
```

Click **Save**

---

### 5. Update Environment Variables

#### In your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Make sure these are set correctly!

---

### 6. Test the Flow

#### Restart your development server:
```bash
npm run dev
```

#### Try logging in:
1. Go to `http://localhost:3000/login`
2. Click **"Continue with Google"**
3. You should be redirected to Google
4. Select your Google account
5. You'll be redirected back to `/auth/callback`
6. Then redirected to `/hub`

---

## 🔍 Troubleshooting

### Error: "Redirect URI Mismatch"
**Fix:** Make sure the redirect URI in Google Console EXACTLY matches:
```
https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
```

Find your project ref in Supabase Settings → General → Reference ID

---

### Error: "OAuth Client Not Found"
**Fix:** 
1. Check Client ID and Secret are correctly pasted in Supabase
2. No extra spaces or line breaks
3. Google OAuth credentials are from the same project

---

### Error: "Access Blocked: This app's request is invalid"
**Fix:**
1. Make sure Google+ API is enabled
2. OAuth consent screen is configured
3. Redirect URIs include Supabase callback URL

---

### Still Getting Errors?
Check the browser console (F12) for detailed error messages.

Common issues:
- ❌ Missing redirect URL in Supabase whitelist
- ❌ Wrong Client ID/Secret
- ❌ Google+ API not enabled
- ❌ Redirect URI mismatch

---

## 📱 For Production

### When deploying to production:

1. **Add production URLs to Google Console:**
   ```
   https://yourdomain.com
   https://yourdomain.com/auth/callback
   ```

2. **Add to Supabase Redirect URLs:**
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/
   ```

3. **Update environment variables:**
   ```env
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

---

## ✅ Quick Checklist

- [ ] Google OAuth credentials created
- [ ] Google+ API enabled
- [ ] Client ID added to Supabase
- [ ] Client Secret added to Supabase
- [ ] Redirect URLs whitelisted in Supabase
- [ ] Supabase callback URL added to Google Console
- [ ] Environment variables set correctly
- [ ] Development server restarted

---

## 🎉 Success!

Once configured, Google login will:
1. ✅ Redirect to Google for authentication
2. ✅ Return to `/auth/callback`
3. ✅ Create user profile automatically
4. ✅ Redirect to `/hub`

Your users can now sign in with one click! 🚀

---

## 📝 Note

The code is already set up correctly in:
- `services/authService.ts` - OAuth function
- `app/auth/callback/page.tsx` - Callback handler
- `components/AuthModal.tsx` - Google button

You just need to configure the Supabase side! 🎯

