# 🔧 Email Signup Troubleshooting Guide

## Quick Diagnosis

### Issue: "Database error saving new user"

**Root Cause**: No automatic profile creation when users sign up

**Fix**: Install database trigger → [See main fix guide](⚡-FIX-EMAIL-SIGNUP-ERROR.md)

---

## Common Errors & Solutions

### 1. "new row violates row-level security policy"

**Symptom**: User account is created, but profile creation fails

**Causes**:
- RLS policy blocks manual profile insertion
- Auth session not established when profile insert happens
- Missing RLS policy for INSERT operations

**Solutions**:

#### Option A: Install the Auto-Trigger (RECOMMENDED) ✅
```bash
# Run this SQL file in Supabase
FIX-USER-SIGNUP-DATABASE-ERROR.sql
```

This creates a server-side trigger that bypasses RLS timing issues.

#### Option B: Temporarily Disable RLS for Testing
```sql
-- WARNING: Only for testing! Not for production!
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

#### Option C: Fix RLS Policies
```sql
-- Make sure this policy exists
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

---

### 2. "Failed to create account" (Generic Error)

**Check These**:

1. **Email Confirmation Settings**
   - Go to: Supabase → Authentication → Settings
   - Check: "Enable email confirmations"
   - If enabled: Users must click email link before profile is created
   - If disabled: Profile should be created immediately

2. **Supabase Connection**
   ```typescript
   // In your app, check:
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log('Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
   ```

3. **Browser Console**
   - Open DevTools (F12)
   - Check Console tab for detailed error messages
   - Look for Supabase/PostgREST errors

---

### 3. User Created But Can't Login

**Symptom**: Signup succeeds, but login fails

**Causes**:
- Profile not created (orphaned auth user)
- Email not confirmed
- RLS blocking profile reads

**Fix**:

1. **Create missing profiles**:
   ```sql
   -- Run: FIX-MISSING-PROFILES.sql
   ```

2. **Check email confirmation**:
   ```sql
   -- In Supabase SQL Editor
   SELECT id, email, confirmed_at, created_at 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
   
   If `confirmed_at` is NULL, user hasn't confirmed email.

3. **Manually confirm user** (for testing):
   ```sql
   UPDATE auth.users 
   SET confirmed_at = NOW(),
       email_confirmed_at = NOW()
   WHERE email = 'test@example.com';
   ```

---

### 4. Google OAuth Works But Email Doesn't

**Why**: Different code paths!

- **Google OAuth**: Supabase handles everything automatically
- **Email Signup**: Your app tries to create profile manually

**Solution**: Install the trigger so both methods work the same way!

```bash
# Install trigger (makes all methods automatic)
FIX-USER-SIGNUP-DATABASE-ERROR.sql
```

---

## Testing Checklist

After applying the fix, test these scenarios:

### ✅ Email/Password Signup
```
1. [ ] New user can sign up with email/password
2. [ ] Profile is created automatically
3. [ ] User can see their profile page
4. [ ] User can create posts/content
```

### ✅ Google OAuth Signup
```
1. [ ] New user can sign up with Google
2. [ ] Profile is created automatically
3. [ ] User can see their profile page
4. [ ] User can create posts/content
```

### ✅ Existing Users
```
1. [ ] Existing users can still login
2. [ ] Their profiles are intact
3. [ ] Their content is still visible
```

---

## Verification Queries

Run these in Supabase SQL Editor to verify everything:

### Check Trigger Installation
```sql
SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Should return: on_auth_user_created | handle_new_user
```

### Check User/Profile Sync
```sql
-- All users should have profiles
SELECT 
  COUNT(DISTINCT au.id) as total_users,
  COUNT(DISTINCT p.id) as users_with_profiles,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT p.id) as missing_profiles
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;

-- missing_profiles should be 0
```

### Check RLS Policies
```sql
-- View all policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

---

## Email Configuration (Supabase Dashboard)

### Recommended Settings for Development:

**Authentication → Settings:**

- ✅ **Enable email confirmations**: OFF (for faster testing)
- ✅ **Enable email change confirmations**: OFF
- ✅ **Secure email change**: OFF
- ⏱️ **JWT expiry**: 3600 (1 hour)

**For Production:**

- ✅ **Enable email confirmations**: ON
- ✅ **Custom SMTP**: Configure (optional, but recommended)
- 📧 **Email templates**: Customize with your branding

---

## Advanced Debugging

### Enable Detailed Logging

**In `contexts/AuthContext.tsx`:**

```typescript
const signUp = async (email: string, password: string, fullName?: string) => {
  console.log('🔵 Starting signup process...')
  console.log('Email:', email)
  console.log('Auth configured:', isSupabaseConfigured())
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    console.log('🔵 Auth signup result:', { data, error })

    if (error) {
      console.error('❌ Auth error:', error)
      return { error }
    }

    console.log('✅ Auth user created:', data.user?.id)
    
    // Profile creation happens automatically via trigger now!
    // But we can still log to verify:
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    console.log('🔵 Profile check:', profile ? '✅ Exists' : '❌ Missing')
    
    return { data, error: null }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    throw err
  }
}
```

### Check Supabase Logs

1. Go to: Supabase Dashboard
2. Click: **Logs** (left sidebar)
3. Select: **Database** or **Auth**
4. Look for errors during signup

---

## The Complete Fix (Step by Step)

### Step 1: Install Trigger
```bash
# In Supabase SQL Editor
Run: FIX-USER-SIGNUP-DATABASE-ERROR.sql
```

### Step 2: Fix Existing Users
```bash
# In Supabase SQL Editor
Run: FIX-MISSING-PROFILES.sql
```

### Step 3: Test Signup
```
1. Open app in incognito window
2. Click "Sign Up"
3. Enter: test@example.com, password, name
4. Submit form
5. Should work! ✅
```

### Step 4: Verify in Database
```sql
-- Check the newest user
SELECT 
  u.id,
  u.email,
  p.name,
  p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 1;
```

---

## Still Not Working?

### Last Resort Fixes

#### 1. Recreate Profiles Table
```sql
-- DANGER: This deletes all profiles!
-- Only use if you have no data yet!

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200),
  username VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users insert own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);
```

Then install the trigger again.

#### 2. Contact Support

If nothing works:
- Share error messages from browser console
- Share error messages from Supabase logs
- Share RLS policies from the verification queries above

---

## Summary

**Main Issue**: Manual profile creation fails due to RLS/timing issues

**Main Solution**: Database trigger for automatic profile creation

**Files to Run**:
1. `FIX-USER-SIGNUP-DATABASE-ERROR.sql` (installs trigger)
2. `FIX-MISSING-PROFILES.sql` (fixes existing users)

**Result**: All signup methods work automatically! 🎉

