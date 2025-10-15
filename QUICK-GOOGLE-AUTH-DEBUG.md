# 🔍 Quick Google Auth Debug

## Your Setup
- Supabase Project: `sjukjubqohkxqjoovqdw`
- Current redirect: `/auth/callback`

## ⚡ Quick Fixes to Try

### 1. Check Supabase Redirect URLs (Most Common Issue)

Go to Supabase Dashboard:
```
https://app.supabase.com/project/sjukjubqohkxqjoovqdw/auth/url-configuration
```

**Ensure these are whitelisted:**
```
http://localhost:3000/auth/callback
http://localhost:3000/*
https://sjukjubqohkxqjoovqdw.supabase.co/auth/v1/callback
```

### 2. Check Google Console Redirect URIs

Go to Google Cloud Console:
```
https://console.cloud.google.com/apis/credentials
```

**Ensure these are added:**
```
http://localhost:3000/auth/callback
https://sjukjubqohkxqjoovqdw.supabase.co/auth/v1/callback
```

### 3. Check Browser Console

Open DevTools (F12) and try logging in again. Look for errors like:
- ❌ "Redirect URI mismatch"
- ❌ "Invalid OAuth client"
- ❌ "Access blocked"

### 4. Test Direct Supabase OAuth URL

Try this URL directly in your browser:
```
https://sjukjubqohkxqjoovqdw.supabase.co/auth/v1/authorize?provider=google
```

Should redirect to Google login.

## 🐛 Common Issues After Updates

### Issue: Code changed the redirect URL
**Before:** Might have been `/` or `/hub`
**Now:** `/auth/callback`

**Fix:** Update Google Console to include `/auth/callback`

### Issue: Callback handler not working
Your callback handler at `app/auth/callback/page.tsx` looks good, but let's add debug logging:

```tsx
// Add at line 14 in app/auth/callback/page.tsx
console.log('🔍 Callback triggered, checking session...');

// After line 16
console.log('📊 Session data:', data);
console.log('❌ Error:', error);
```

### Issue: PKCE flow (if Supabase updated)
Recent Supabase updates use PKCE by default. Make sure your Google OAuth settings allow it.

## 🚀 Quick Test

Run this in browser console on your login page:

```javascript
// Check Supabase connection
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Test Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin + '/auth/callback'
  }
});

console.log('OAuth data:', data);
console.log('OAuth error:', error);
```

## 📝 What to Check Next

1. **Open Browser DevTools (F12)**
2. **Go to Network tab**
3. **Filter by "auth"**
4. **Try logging in with Google**
5. **Look for failed requests**

Common failures:
- `400 Bad Request` → Redirect URI mismatch
- `401 Unauthorized` → Invalid credentials
- `403 Forbidden` → Google OAuth not enabled

## 🔧 If Nothing Works

Create a fresh test:

```typescript
// Create: app/test-auth/page.tsx
'use client';

import { supabase } from '@/lib/supabase';

export default function TestAuth() {
  const testGoogle = async () => {
    console.log('Starting Google OAuth test...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    console.log('Result:', { data, error });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Google OAuth Test</h1>
      <button 
        onClick={testGoogle}
        className="bg-blue-500 text-white px-6 py-3 rounded"
      >
        Test Google Login
      </button>
    </div>
  );
}
```

Then go to: `http://localhost:3000/test-auth`

## 💡 Most Likely Issue

Since it was working before, **99% chance** it's one of these:
1. ✅ Redirect URL not whitelisted in Supabase
2. ✅ Redirect URI not added to Google Console  
3. ✅ Browser cached old redirect URL

**Try:** Hard refresh (Ctrl+Shift+R) and clear cookies for localhost.

