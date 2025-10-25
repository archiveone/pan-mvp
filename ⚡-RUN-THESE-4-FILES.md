# ⚡ RUN THESE 5 FILES IN ORDER

Copy-paste each file into Supabase SQL Editor and run.

---

## 1️⃣ FIRST: Fix Table Structure

### `⚡-FIX-USER-PREFERENCES-TABLE.sql`

**Fixes**: Missing `accent_color` column error

**Success message**:
```
✅ USER PREFERENCES TABLE FIXED!
✅ accent_color column added
```

---

## 2️⃣ SECOND: Fix ALL User Tables RLS

### `⚡-FIX-ALL-USER-TABLES.sql`

**Fixes**: RLS on user_gamification, user_trust_scores, user_preferences

**Success message**:
```
✅ ALL USER TABLES RLS FIXED!
✅ user_gamification - RLS configured
✅ user_trust_scores - RLS configured
🎉 User signup should work completely now!
```

---

## 3️⃣ THIRD: Enable Auto-Signup (Final)

### `⚡-SIMPLEST-FIX.sql`

**Fixes**: Auto-creates profiles when users sign up

**Success message**:
```
✅ FIXED! The trigger now has SECURITY DEFINER
🎉 Try signing up now - it should work!
```

---

## 4️⃣ FOURTH: Fix Existing Users

### `⚡-FIX-FOREIGN-KEY-ERROR.sql`

**Fixes**: Creates missing profiles, allows posts

**Success message**:
```
✅ FOREIGN KEY ERROR FIXED!
🎉 All users now have profiles!
🎉 You can now create posts!
```

---

## 5️⃣ FIFTH: Enable Editing

### `⚡-FIX-ALL-EDITING.sql`

**Fixes**: Profile editing, hub box editing, all RLS

**Success message**:
```
✅ ALL EDITING FIXED!
✅ Profile - Can edit name, username, bio, avatar
✅ Hub Boxes - Can create, edit, delete boxes
🎉 Try editing everything now!
```

---

## ✅ Done!

After running all 5:
- ✅ Signup works (no RLS errors)
- ✅ Posts work (no foreign key errors)
- ✅ Editing works (profile & hub boxes)
- ✅ Everything works!

Now you can **push to Vercel**! 🚀

