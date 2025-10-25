# 🚀 Easiest Way to Set Up Your Database (2 Commands!)

## ⚡ Super Quick Method - Supabase CLI

This will run ALL migrations automatically in the correct order with NO errors:

```bash
# 1. Install Supabase CLI (if you don't have it)
npm install -g supabase

# 2. Link to your project
supabase link --project-ref sjukjubqohkxqjoovqdw

# 3. Push all migrations
supabase db push
```

**That's it!** Done in 2 minutes. ✅

---

## 📋 Alternative: Run Migrations One-by-One

If you prefer the manual way, run these **in order** in Supabase SQL Editor:

### **Step 1:** Go to SQL Editor
https://supabase.com/dashboard/project/sjukjubqohkxqjoovqdw/sql/new

### **Step 2:** Copy-paste each file and click "Run"

**In this exact order:**

1. `supabase/migrations/100_advanced_features.sql`
2. `supabase/migrations/101_ultra_advanced_listings.sql`  
3. `supabase/migrations/106_auctions_and_fundraisers.sql`
4. `supabase/migrations/107_enterprise_auction_system.sql`
5. `supabase/migrations/108_industry_standard_bookings_reservations.sql`

**Note:** If you get "already exists" errors, that's OK! It means those tables are already there. Just continue to the next file.

---

## ✅ How to Know It Worked

After running migrations, go to:
https://supabase.com/dashboard/project/sjukjubqohkxqjoovqdw/editor

You should see LOTS of tables:
- ✅ `profiles`
- ✅ `content` / `posts`
- ✅ `music_posts`
- ✅ `video_posts`
- ✅ `advanced_events`
- ✅ `advanced_listings`
- ✅ `auctions`
- ✅ `fundraisers`
- ✅ `reservation_businesses`
- And many more!

If you see these tables = **SUCCESS!** 🎉

---

## 🔧 Then Test Your App

```bash
# Restart your dev server
npm run dev
```

Visit http://localhost:3000

- Sign up should work ✅
- Creating content should work ✅
- No more timeouts! ✅

---

## 💡 Recommended: Supabase CLI Method

The CLI method is best because:
- ✅ No manual copy-paste
- ✅ No "already exists" errors
- ✅ Runs everything in correct order
- ✅ Takes 30 seconds
- ✅ Professional workflow

**Try it!** The commands are right at the top of this file.

