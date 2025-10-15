# 🚀 MIGRATIONS - RUN ORDER GUIDE

## ✅ ALL MIGRATIONS TO RUN (IN ORDER)

You have **6 migrations** created during our session. Run them in this order:

---

## 📋 MIGRATION ORDER

### **1. `100_advanced_features.sql`** ✅
```
Creates:
• Stories system
• Live streaming
• Reactions system
• Advanced comments
• Polls
• User reputation

Status: Required - Run first
```

### **2. `101_ultra_advanced_listings.sql`** ✅
```
Creates:
• Bookable listings (hotels, restaurants)
• Advanced listings (marketplace)
• Events & ticketing
• Service bookings
• Payment integrations

Status: Required - Run second
```

### **3. `102_verified_profiles_and_notifications.sql`** ✅
```
Creates:
• Verified profiles system
• Gamification (points, levels, achievements)
• Smart notifications
• User achievements

Status: Required - Run third
```

### **4. `103_analytics_system.sql`** ✅
```
Creates:
• analytics_events table
• analytics_aggregated table
• revenue_transactions table
• Basic dashboard views

Status: Required - Run fourth
```

### **5. `104_advanced_analytics.sql`** ✅
```
Creates:
• stream_analytics (Spotify/YouTube style)
• sales_analytics (Shopify style)
• view_analytics (detailed tracking)
• conversion_analytics (funnels)
• engagement_scores

Status: Required - Run fifth
```

### **6. `105_user_preferences.sql`** ✅
```
Creates:
• user_preferences (theme customization)
• dashboard_widgets (modular dashboard)
• User color choices

Status: Required - Run sixth (LATEST)
```

---

## 🚀 HOW TO RUN

### **Option 1: Supabase CLI (Recommended)**

```bash
# Run from your project directory:
cd "C:\Users\Samsung Galaxy\Downloads\pan"

# Push all migrations at once:
supabase db push
```

This will run ALL migrations in order automatically!

---

### **Option 2: Supabase Dashboard**

1. Go to your Supabase project
2. Click "SQL Editor" (left sidebar)
3. Create a new query
4. Copy & paste migration contents **IN ORDER:**

#### **Run in this sequence:**
```
1. Copy 100_advanced_features.sql → Run
2. Copy 101_ultra_advanced_listings.sql → Run
3. Copy 102_verified_profiles_and_notifications.sql → Run
4. Copy 103_analytics_system.sql → Run
5. Copy 104_advanced_analytics.sql → Run
6. Copy 105_user_preferences.sql → Run
```

---

## ✅ WHAT EACH MIGRATION DOES

### **Migration 100** - Core Features
```
Tables:
• stories, story_views, story_reactions
• live_streams, live_stream_viewers
• reactions, comments, polls
• user_reputation, moderation_actions
```

### **Migration 101** - Listings & Bookings
```
Tables:
• bookable_listings (hotels, restaurants)
• booking_requests
• advanced_listings (marketplace)
• advanced_events (ticketing)
• escrow_transactions
```

### **Migration 102** - Verification & Gamification
```
Tables:
• user_verification_requests
• user_achievements
• user_points_history
• smart_notifications
```

### **Migration 103** - Basic Analytics
```
Tables:
• analytics_events
• analytics_aggregated
• revenue_transactions

Views:
• user_dashboard_stats
• trending_content
```

### **Migration 104** - Advanced Analytics
```
Tables:
• stream_analytics
• sales_analytics
• view_analytics
• conversion_analytics
• engagement_scores

Views:
• sales_performance
• stream_performance
• conversion_funnel
```

### **Migration 105** - User Customization
```
Tables:
• user_preferences (theme settings)
• dashboard_widgets (modular dashboard)

Functions:
• initialize_user_preferences()
• initialize_dashboard_widgets()
```

---

## 🎯 QUICK COMMAND

### **Run All Migrations:**
```bash
supabase db push
```

That's it! ✅

---

## ⚠️ IMPORTANT NOTES

### **Run in Order:**
```
Migrations depend on each other!
Must run in sequence: 100 → 101 → 102 → 103 → 104 → 105

supabase db push handles this automatically! ✅
```

### **Already Run Some?**
```
All migrations are IDEMPOTENT:
• Use "CREATE TABLE IF NOT EXISTS"
• Use "CREATE INDEX IF NOT EXISTS"
• Use "DROP POLICY IF EXISTS"
• Safe to run multiple times!

If you already ran 100-102, just run:
supabase db push
(Will only apply 103, 104, 105)
```

---

## 🎊 AFTER MIGRATIONS COMPLETE

### **You'll Have:**
```
✅ All database tables
✅ All indexes
✅ All RLS policies
✅ All views
✅ All functions
✅ Complete analytics system
✅ User customization system
✅ Modular dashboard system

Ready to use:
✅ /dashboard (analytics)
✅ /dashboard/modular (modular)
✅ /settings/appearance (theme)
✅ All features enabled!
```

---

## 🚀 SIMPLE ANSWER

**Just run:**
```bash
supabase db push
```

**Or:**
```bash
# If you prefer one-by-one:
cd supabase/migrations

# Then in Supabase Dashboard SQL Editor,
# copy & paste each file in order (100-105)
```

---

## ✅ VERIFICATION

After running, verify in Supabase Dashboard:

```
Database → Tables:

Should see:
✅ stories
✅ bookable_listings
✅ user_verification_requests
✅ analytics_events
✅ stream_analytics
✅ user_preferences
✅ dashboard_widgets

(+ many more!)
```

---

## 🎉 SUMMARY

**What to run:**
```bash
supabase db push
```

**What it does:**
- Runs all 6 migrations in order
- Creates all tables
- Enables all features
- Sets up analytics
- Enables customization

**Result:**
✅ Complete database setup
✅ All systems enabled
✅ Ready to use!

**JUST RUN: `supabase db push`** 🚀

