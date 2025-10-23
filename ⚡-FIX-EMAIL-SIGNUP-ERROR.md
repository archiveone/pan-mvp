# ⚡ Quick Fix: Database Error When Signing Up with Email

## The Problem

When users try to sign up with **email/password** (not Google OAuth), they get a database error. This happens because:

1. ✅ Supabase creates the auth user successfully
2. ❌ The app tries to manually create a profile in the database
3. ❌ Either the auth session isn't ready yet, or RLS policies block it

## The Solution

Use a **database trigger** that automatically creates profiles when users sign up. This is the recommended Supabase practice!

---

## How to Fix (2 minutes)

### Step 1: Run the SQL Fix

1. Open your **Supabase Dashboard**
2. Go to: **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the entire contents of: `FIX-USER-SIGNUP-DATABASE-ERROR.sql`
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)

You should see:
```
✅ Auto-profile creation trigger installed!
✅ New users will automatically get a profile
✅ Works for email/password and all OAuth providers
🎉 Try signing up with email/password now!
```

### Step 2: Test It!

1. Open your app (incognito/private window)
2. Click "Sign Up"
3. Enter email, password, and name
4. Click "Create Account"
5. ✅ Should work now!

---

## What This Does

The SQL script creates a **database trigger** that:

- Automatically runs when a new user signs up
- Creates a profile in the `profiles` table
- Uses data from Supabase auth metadata (like `full_name`)
- Won't fail user creation if profile creation fails (safe fallback)
- Works for ALL signup methods (email, Google, etc.)

---

## Technical Details

### Before (Manual Profile Creation)
```typescript
// In your app code (AuthContext.tsx)
const { data, error } = await supabase.auth.signUp(...)
if (data.user) {
  // Manually try to create profile - CAN FAIL!
  await supabase.from('profiles').insert(...)
}
```

**Problem**: Timing issues, RLS policy conflicts, manual management

### After (Automatic Trigger)
```sql
-- In database (runs automatically)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Benefit**: Automatic, reliable, server-side, works every time!

---

## Existing Users

### What About Users Who Already Signed Up?

If some users signed up but don't have profiles, you can create them manually:

```sql
-- Run this in Supabase SQL Editor to create missing profiles
INSERT INTO profiles (id, name, bio, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  'Welcome to Pan!',
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

This finds users without profiles and creates them.

---

## Verify It's Working

After running the SQL, you can verify:

```sql
-- Check if trigger exists
SELECT tgname, proname 
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Should show: on_auth_user_created | handle_new_user
```

---

## Alternative: Remove Manual Profile Creation

If you want to rely ONLY on the trigger (recommended), you can simplify your code:

**In `contexts/AuthContext.tsx`** (lines 171-200):

```typescript
// ❌ OLD: Manual profile creation
if (data.user) {
  try {
    await supabase.from('profiles').insert([...])
  } catch { }
}

// ✅ NEW: Trust the trigger (no manual creation needed)
// The database trigger handles it automatically!
```

But this is optional - having both doesn't hurt!

---

## Still Having Issues?

### Error: "new row violates row-level security policy"

If you still get RLS errors:

```sql
-- Make profiles table more permissive for system operations
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Then re-enable with proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Error: "duplicate key value violates unique constraint"

User already has a profile! This means:
- Trigger is working
- They might have signed up before
- Try logging in instead of signing up

---

## Summary

✅ **Run**: `FIX-USER-SIGNUP-DATABASE-ERROR.sql` in Supabase SQL Editor  
✅ **Test**: Sign up with email/password  
✅ **Done**: All signup methods now work automatically!

This is the proper way to handle user profiles in Supabase! 🎉

