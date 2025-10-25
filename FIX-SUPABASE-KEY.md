# 🔧 Fix: Invalid Supabase API Key

## Problem
Your `.env.local` file has a corrupted/truncated Supabase anon key:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...7K8Z8K8Z8K8Z... ❌ INVALID
```

## ✅ Quick Fix (2 minutes)

### 1. Get Your Real Supabase Keys

Go to your Supabase Dashboard:
```
https://app.supabase.com/project/sjukjubqohkxqjoovqdw/settings/api
```

Or:
1. Go to https://app.supabase.com
2. Select your project: `sjukjubqohkxqjoovqdw`
3. Click **Settings** (⚙️ icon in sidebar)
4. Click **API**

### 2. Copy the Correct Keys

You'll see:
- **Project URL** - Copy this
- **anon/public key** - Copy this (it's a LONG JWT token)

The anon key should look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdWtqdWJxb2hreHFqb292cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzEsImV4cCI6MjA1MDU1MDg3MX0.ACTUAL_SIGNATURE_HERE_VERY_LONG_STRING
```

**Important:** The key should be about 200-300 characters long!

### 3. Update Your .env.local File

Replace the contents of `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sjukjubqohkxqjoovqdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_REAL_ANON_KEY_HERE
```

**Make sure:**
- ✅ Copy the ENTIRE key (no line breaks)
- ✅ No spaces before or after the key
- ✅ No quotes around the key
- ✅ The key is on ONE line

### 4. Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 5. Test It

Open browser console and run:
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
```

Should show:
```
Supabase URL: https://sjukjubqohkxqjoovqdw.supabase.co
Key length: 200+ (or similar long number)
```

## 🔍 How to Know If It's Fixed

After updating the key:
1. Restart dev server
2. Try logging in with Google
3. Should NOT see "Invalid API key" error anymore

## 📋 Common Mistakes

❌ **Don't do this:**
```env
# Missing key
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Key with quotes
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."

# Key on multiple lines
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci
OiJIUzI1NiIsInR5c...

# Key with spaces
NEXT_PUBLIC_SUPABASE_ANON_KEY= eyJhbGci... 
```

✅ **Do this:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://sjukjubqohkxqjoovqdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdWtqdWJxb2hreHFqb292cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzEsImV4cCI6MjA1MDU1MDg3MX0.VERY_LONG_SIGNATURE_HERE
```

## 🎯 Quick Steps Summary

1. [ ] Go to Supabase Dashboard → Settings → API
2. [ ] Copy **Project URL**
3. [ ] Copy **anon public** key (the long one)
4. [ ] Paste both into `.env.local`
5. [ ] Restart dev server
6. [ ] Test login

## 💡 Why This Happened

Your anon key got corrupted - possibly:
- Copied incorrectly
- File got corrupted
- Key was sanitized/masked for security
- Auto-formatting added line breaks

## 🚨 Security Note

**NEVER commit `.env.local` to Git!**

Check your `.gitignore` file includes:
```
.env
.env.local
.env*.local
```

Your anon key is safe to expose in frontend code (it's public), but good practice to keep it in `.env.local`.

