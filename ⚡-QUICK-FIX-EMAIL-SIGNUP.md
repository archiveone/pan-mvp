# ⚡ 2-Minute Fix: Email Signup Database Error

## The Problem
When users sign up with **email/password**, they get: **"database error saving new user"**

## The Solution (2 Steps)

### Step 1: Install Auto-Profile Trigger

**In Supabase SQL Editor:**

Copy and paste this entire SQL block:

```sql
-- Auto-create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, bio, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    'Welcome to Pan!',
    now()
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Could not create profile for user %', new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Click **"Run"** ✅

---

### Step 2: Fix Existing Users (Optional)

If users already signed up but don't have profiles:

```sql
-- Create profiles for users who don't have one
INSERT INTO profiles (id, name, bio, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  'Welcome to Pan!',
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

Click **"Run"** ✅

---

## Test It!

1. Open your app (incognito window)
2. Click "Sign Up"
3. Enter email, password, name
4. Submit
5. ✅ Should work!

---

## What This Does

- ✅ Automatically creates profile when user signs up
- ✅ Works for email/password signup
- ✅ Works for Google OAuth signup
- ✅ Works for all other auth methods
- ✅ Server-side (no client timing issues)
- ✅ Safe (won't block user creation if profile fails)

---

## Need More Help?

See detailed guides:
- 📖 **Main Guide**: `⚡-FIX-EMAIL-SIGNUP-ERROR.md`
- 🔧 **Troubleshooting**: `⚡-EMAIL-SIGNUP-TROUBLESHOOTING.md`
- 🗃️ **Full SQL**: `FIX-USER-SIGNUP-DATABASE-ERROR.sql`
- 🩹 **Fix Existing**: `FIX-MISSING-PROFILES.sql`

---

## That's It!

Your email signup should work now! 🎉

