# 🔧 Analytics Migration Fix

## ❌ ERROR
```
ERROR: 42703: column p.media_type does not exist
LINE 139: p.media_type,
```

## ✅ FIX APPLIED

### **Problem:**
The `trending_content` view was trying to reference columns that don't exist in the `posts` table:
- `p.media_type`
- `p.content_type`

### **Solution:**
Removed these column references from the view definition since they're not needed for the trending calculation.

### **Fixed View:**
```sql
CREATE OR REPLACE VIEW trending_content AS
SELECT 
  p.id,
  p.title,
  p.user_id,
  p.created_at,
  -- Aggregated metrics
  COALESCE(SUM(aa.views), 0) as views_7d,
  COALESCE(SUM(aa.likes), 0) as likes_7d,
  COALESCE(SUM(aa.saves), 0) as saves_7d,
  COALESCE(SUM(aa.shares), 0) as shares_7d,
  -- Trending score calculation
  COALESCE(SUM(aa.views), 0) + 
  COALESCE(SUM(aa.likes), 0) * 5 + 
  COALESCE(SUM(aa.saves), 0) * 10 + 
  COALESCE(SUM(aa.shares), 0) * 15 as trending_score
FROM posts p
LEFT JOIN analytics_aggregated aa ON p.id = aa.content_id
WHERE aa.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.title, p.user_id, p.created_at
ORDER BY trending_score DESC;
```

## 🚀 MIGRATION NOW READY

The migration file `103_analytics_system.sql` is now fixed and ready to run!

```bash
# Run the migration:
supabase db push
```

**Migration includes:**
✅ analytics_events table  
✅ analytics_aggregated table  
✅ revenue_transactions table  
✅ user_dashboard_stats view (fixed)  
✅ trending_content view (fixed)  
✅ All indexes and RLS policies  

**Error resolved!** 🎉

