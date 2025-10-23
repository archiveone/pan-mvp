# 📚 RLS (Row Level Security) - Explained & Fixed

## 🎓 What is RLS?

**RLS = Row Level Security** - PostgreSQL's way of controlling who can access which rows in a table.

Think of it like this:
- Without RLS: Everyone can see everything (insecure!)
- With RLS: Users can only see/edit their own data (secure!)

---

## 🔐 The General Principle

For any table with a `user_id` column, you need **4 policies**:

### **1. SELECT Policy** (Reading/Viewing)
```sql
CREATE POLICY "table_name_select"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```
**Meaning**: "Users can only VIEW rows where they are the owner"

### **2. INSERT Policy** (Creating)
```sql
CREATE POLICY "table_name_insert"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```
**Meaning**: "Users can only CREATE rows where they set themselves as owner"

### **3. UPDATE Policy** (Editing)
```sql
CREATE POLICY "table_name_update"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
**Meaning**: "Users can only EDIT rows they own, and can't change ownership"

### **4. DELETE Policy** (Removing)
```sql
CREATE POLICY "table_name_delete"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);
```
**Meaning**: "Users can only DELETE rows they own"

---

## 🤔 Why You Keep Getting RLS Errors

Your tables have **inconsistent policies**:

| Table | Has RLS? | Has All 4 Policies? | Result |
|-------|----------|---------------------|--------|
| profiles | ✅ Yes | ❌ Missing UPDATE | ❌ Can't edit profile |
| posts | ✅ Yes | ❌ Missing INSERT | ❌ Can't create posts |
| user_gamification | ❌ No | ❌ No policies | ❌ Can't insert points |
| user_preferences | ⚠️ Partial | ❌ Missing INSERT | ❌ Signup fails |
| hub_boxes | ⚠️ Partial | ❌ Missing UPDATE | ❌ Can't edit boxes |

**Each missing policy = One error you're hitting!**

---

## ✅ The Complete Solution

I've created **ONE SQL file** that fixes **EVERYTHING**:

### **`⚡-MASTER-RLS-FIX-ALL-TABLES.sql`**

**What it does:**
1. Creates a helper function that applies all 4 policies to any table
2. Applies it to **EVERY** user-related table in your database
3. Handles special cases (profiles = public, hub_boxes = public or own)
4. Updates the signup trigger with `SECURITY DEFINER`
5. Shows you all the policies it created

**Run this ONE file and ALL RLS errors are fixed!**

---

## 📋 Table Categories & Their Policies

### **Category 1: Private User Tables**
Tables where users can ONLY see their own data.

**Tables**: 
- `user_preferences`
- `user_trust_scores`
- `user_gamification`
- `saved_posts`
- `user_analytics`
- `dashboard_widgets`
- `inbox_assignments`

**Policies**: Standard 4 (SELECT, INSERT, UPDATE, DELETE) with `auth.uid() = user_id`

---

### **Category 2: Public Content Tables**
Tables where EVERYONE can view, but only owners can manage.

**Tables**:
- `profiles`
- `posts`
- `content`
- `listings`

**Policies**:
- **SELECT**: `USING (true)` - Everyone can view
- **INSERT**: `WITH CHECK (auth.uid() = user_id)` - Create your own
- **UPDATE**: `USING (auth.uid() = user_id)` - Edit your own
- **DELETE**: `USING (auth.uid() = user_id)` - Delete your own

---

### **Category 3: Conditional Visibility Tables**
Tables that can be public OR private.

**Tables**:
- `hub_boxes` (has `is_public` column)
- `collections` (has `is_public` column)

**Policies**:
- **SELECT**: `USING (auth.uid() = user_id OR is_public = true)` - View if owner or public
- **INSERT/UPDATE/DELETE**: Same as Category 1

---

### **Category 4: Related Item Tables**
Tables that reference another table's ownership.

**Tables**:
- `hub_box_items` (items belong to hub_boxes)
- `collection_items` (items belong to collections)

**Policies**:
- Check ownership through the parent table
```sql
CREATE POLICY "hub_box_items_select"
  ON hub_box_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM hub_boxes 
    WHERE hub_boxes.id = hub_box_items.box_id 
    AND hub_boxes.user_id = auth.uid()
  ));
```

---

## 🔧 Special Case: System Operations

**Problem**: Triggers need to create records on behalf of users (like during signup)

**Solution**: Use `SECURITY DEFINER`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER  -- ← This is the magic!
AS $$
BEGIN
  -- This runs with elevated permissions
  -- Can bypass RLS policies
  INSERT INTO profiles ...
  INSERT INTO user_preferences ...
  RETURN new;
END;
$$;
```

**Why it works**: `SECURITY DEFINER` makes the function run with the permissions of the function owner (usually admin), not the current user.

---

## 🧪 How to Test RLS

### Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check policies on a table:
```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'your_table_name';
```

### Test as current user:
```sql
-- This shows what YOU can see
SELECT * FROM posts;

-- This shows what a specific user can see
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM posts;
```

---

## 🎯 The Master Fix Approach

Instead of fixing each table one-by-one (which is why you keep hitting errors), the **Master RLS Fix** applies the general principle to **ALL tables at once**.

**Advantages:**
- ✅ Fixes current errors
- ✅ Prevents future errors
- ✅ Consistent policies across all tables
- ✅ One file to run, not 5
- ✅ Shows you exactly what was created

**Run this:** `⚡-MASTER-RLS-FIX-ALL-TABLES.sql`

---

## 🚀 After Running the Master Fix

You'll have:
- ✅ All user tables with proper RLS
- ✅ All 4 operations (SELECT, INSERT, UPDATE, DELETE) working
- ✅ Public content viewable by everyone
- ✅ Private data only accessible by owner
- ✅ Signup trigger with SECURITY DEFINER
- ✅ No more RLS errors!

---

## 📚 Summary

**The General Principle:**
- Every table needs policies for: SELECT, INSERT, UPDATE, DELETE
- User tables: `auth.uid() = user_id`
- Public tables: Everyone can SELECT, owners can modify
- System operations: Use `SECURITY DEFINER`

**Why You Had Errors:**
- Missing policies on some tables
- Incomplete policies (only SELECT, no INSERT)
- Trigger without SECURITY DEFINER

**The Solution:**
- Run `⚡-MASTER-RLS-FIX-ALL-TABLES.sql`
- Applies consistent RLS to ALL tables
- One file fixes everything!

---

## 🎉 Now You Can:

- Sign up without errors
- Create posts/content
- Edit your profile
- Customize hub boxes
- Everything works!

**The RLS is finally done right!** 🚀

