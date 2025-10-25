# 🚀 Quick Start - Get Your App Fully Running

## 📝 Step-by-Step Setup (15 minutes)

### 1️⃣ Run Essential SQL Files

**Go to:** https://supabase.com/dashboard/project/sjukjubqohkxqjoovqdw/sql/new

**Run these in order:**

```
1. CREATE-STORIES-TABLE.sql         (Stories feature)
2. CREATE-MODERATION-SYSTEM.sql     (Moderation & reports)
3. FIX-TRANSACTIONS-TABLE.sql       (Purchase system)
```

**Then make yourself admin:**
```sql
-- Option 1: Find your ID first
SELECT id, name, username FROM profiles ORDER BY created_at DESC LIMIT 5;

-- Then use your ID:
UPDATE profiles SET is_admin = true WHERE id = 'YOUR-ID-HERE';

-- OR Option 2: Make most recent user admin (if that's you)
UPDATE profiles 
SET is_admin = true, is_moderator = true
WHERE id = (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1);
```

---

### 2️⃣ Create System Collections for Your User

```sql
SELECT create_system_collections_for_user('YOUR-USER-ID');
```

This creates:
- 🎫 My Tickets
- 🏠 My Bookings
- 📦 My Purchases
- 📚 My Library
- ❤️ Favorites

---

### 3️⃣ Create Test Content (Optional)

```sql
-- Run this to create sample marketplace items
-- Copy from TEST-PURCHASE-FLOW.sql
```

---

### 4️⃣ Test Purchase Flow

1. **Go to homepage** - See posts
2. **Find a paid item** - Look for "Buy $X.XX" button
3. **Click purchase** - Stripe modal opens
4. **Use test card:** `4242 4242 4242 4242`
5. **Check library** - Go to `/my-library`
6. **Verify purchase** - Item should appear

---

### 5️⃣ Test Moderation

1. **Click flag icon** on any post
2. **Submit report** - Choose category
3. **Go to** `/admin/moderation`
4. **Review report** - See pending reports
5. **Take action** - Dismiss, warn, or remove

---

### 6️⃣ Test Stories

1. **Click camera icon** or stories bar
2. **Allow camera** permission
3. **Take photo** or upload
4. **Add text/stickers**
5. **Publish** - Appears in stories bar

---

## ✅ Verification Checklist

After setup, you should have:

- ✅ **40 posts showing** on homepage
- ✅ **Purchase buttons** on marketplace items
- ✅ **Report button** on all posts
- ✅ **System collections** in your hub
- ✅ **Stories feature** working
- ✅ **Admin access** to moderation dashboard
- ✅ **No console errors** (check DevTools)

---

## 🎯 What Each Feature Does

### Homepage Feed
- Shows all content types (posts, music, videos, events)
- Search and filter
- Click to view details
- Purchase or save items

### Collections
- **System Collections** (auto-created):
  - My Tickets - Purchased event tickets
  - My Bookings - Reservations
  - My Purchases - Physical items
  - My Library - Digital content (music, videos, courses)
- **Custom Collections** - Create your own!

### Hub (`/hub`)
- Personal dashboard
- Customizable widgets
- Quick access to collections
- Profile management

### Moderation (`/admin/moderation`)
- Review user reports
- Remove inappropriate content
- Warn or ban users
- Track trust scores

---

## 🛠️ Common Issues & Fixes

### "Posts not showing"
Run: `FIX-RLS-SAFE-NO-DEADLOCK.sql`

### "Purchase button doesn't work"
- Check Stripe keys in Vercel
- Run: `FIX-TRANSACTIONS-TABLE.sql`

### "Collections not showing"
Run: `CREATE-UNIFIED-COLLECTIONS-SYSTEM.sql`

### "Can't access moderation"
Make yourself admin (see Step 1)

### "Stories don't save"
Run: `CREATE-STORIES-TABLE.sql`

---

## 📊 Database Overview

**Your database has ~15 tables:**

**Core:**
- posts (universal content)
- profiles (users)
- comments, likes, notifications

**Collections:**
- collections
- collection_items

**E-Commerce:**
- transactions

**Social:**
- conversations, messages
- stories, story_views

**Moderation:**
- moderation_reports
- user_trust_scores
- user_actions

**Hub:**
- hub_boxes
- user_preferences

---

## 🎉 You're Ready!

Your app is a **full-featured platform** combining:
- 📱 Social media (posts, stories, messaging)
- 🛒 E-commerce (marketplace, payments)
- 🎫 Ticketing (events with QR codes)
- 🏠 Bookings (Airbnb-style)
- 🎵 Digital content (music, videos)
- 🛡️ Moderation (reports, trust scores)
- 📁 Collections (organization)

**Everything unified in ONE app!** 🚀

---

## 📞 Next Actions

1. **Run the 3 SQL files** (15 min)
2. **Test purchase flow** (5 min)
3. **Clean up old files** (5 min)
4. **Share with friends** (get feedback!)

**Then you're LIVE!** 🎊

