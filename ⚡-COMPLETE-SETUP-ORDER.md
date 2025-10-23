# ⚡ Complete Database Setup - Run in This Order!

## The Issues You're Hitting

1. ❌ **User signup errors** - RLS policies blocking
2. ❌ **Missing columns** - user_preferences table incomplete
3. ❌ **Foreign key errors** - profiles not created
4. ❌ **Editing not working** - RLS blocking updates

## ✅ Run These SQL Files IN ORDER

### **Step 1: Fix User Preferences Table**
**File**: `⚡-FIX-USER-PREFERENCES-TABLE.sql`

**What it does**:
- Adds missing `accent_color` column
- Adds other preference columns
- Fixes the trigger function
- Prevents the column error

**Run this FIRST!**

---

### **Step 2: Fix User Signup Trigger**
**File**: `⚡-SIMPLEST-FIX.sql`

**What it does**:
- Creates auto-profile trigger with SECURITY DEFINER
- Handles user_trust_scores
- Handles user_preferences (safely)
- Makes signup work automatically

**Run this SECOND!**

---

### **Step 3: Fix Missing Profiles**
**File**: `⚡-FIX-FOREIGN-KEY-ERROR.sql`

**What it does**:
- Creates profiles for ALL existing users
- Fixes foreign key constraints
- Allows posts to be created

**Run this THIRD!**

---

### **Step 4: Fix Editing Permissions**
**File**: `⚡-FIX-ALL-EDITING.sql`

**What it does**:
- Fixes hub box editing RLS
- Fixes profile editing RLS
- Allows creating, updating, deleting

**Run this FOURTH!**

---

## Quick Copy-Paste Checklist

```
✅ Step 1: ⚡-FIX-USER-PREFERENCES-TABLE.sql
✅ Step 2: ⚡-SIMPLEST-FIX.sql  
✅ Step 3: ⚡-FIX-FOREIGN-KEY-ERROR.sql
✅ Step 4: ⚡-FIX-ALL-EDITING.sql
```

After running all 4, you should see:
```
✅ User preferences table fixed
✅ Auto-profile trigger installed
✅ All users have profiles
✅ All editing works
🎉 Everything should work now!
```

---

## How to Run Each File

1. Open **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the ENTIRE contents of the file
5. Paste into SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Check for success messages
8. Move to next file

---

## After Running All 4 Scripts

### ✅ Test Everything:

1. **Sign Up** - Create a new account
   - Should work without errors
   - Profile created automatically
   
2. **Create a Post** - Upload content
   - Should work without foreign key errors
   - Content appears in feed
   
3. **Edit Profile** - Change name, bio, avatar
   - Should save successfully
   - Changes appear immediately
   
4. **Edit Hub Boxes** - Customize colors, names
   - Should save successfully
   - Changes persist
   
5. **Save to Folders** - Add items to collections
   - Should work without errors
   - Items appear in collections

---

## What Each Error Means

### Error: `column "accent_color" does not exist`
**Fix**: Run Step 1 (`⚡-FIX-USER-PREFERENCES-TABLE.sql`)

### Error: `new row violates row-level security policy`
**Fix**: Run Step 2 (`⚡-SIMPLEST-FIX.sql`)

### Error: `violates foreign key constraint "posts_user_id_fkey"`
**Fix**: Run Step 3 (`⚡-FIX-FOREIGN-KEY-ERROR.sql`)

### Error: `Failed to update box` or `Failed to save profile`
**Fix**: Run Step 4 (`⚡-FIX-ALL-EDITING.sql`)

---

## Why This Order Matters

```
Step 1 (User Preferences)
  ↓ Creates table structure
  
Step 2 (Signup Trigger)
  ↓ Uses table from Step 1
  ↓ Creates profiles automatically
  
Step 3 (Fix Existing Users)
  ↓ Needs trigger from Step 2
  ↓ Creates profiles for old users
  
Step 4 (Fix Editing)
  ↓ Needs profiles from Step 3
  ↓ Allows modifications
```

Running out of order might cause errors!

---

## Still Having Issues?

### Check What You Have

Run this in Supabase SQL Editor:

```sql
-- Check trigger exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check all users have profiles
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

-- Check user_preferences columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_preferences';

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'hub_boxes', 'posts');
```

---

## Summary

**Run these 4 SQL files in order:**

1. `⚡-FIX-USER-PREFERENCES-TABLE.sql` - Fix table structure
2. `⚡-SIMPLEST-FIX.sql` - Auto-create profiles
3. `⚡-FIX-FOREIGN-KEY-ERROR.sql` - Fix existing users
4. `⚡-FIX-ALL-EDITING.sql` - Allow editing

**Then everything will work!** 🚀

After this, you can push to Vercel with confidence! 🎉

