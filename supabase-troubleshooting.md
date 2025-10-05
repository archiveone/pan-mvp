# Supabase Authentication Troubleshooting

## Issue: Email Validation Errors

Your Supabase project is rejecting email addresses with "Email address is invalid" errors. This is likely due to one of these settings:

### 🔧 **Solution 1: Disable Email Confirmation (Recommended for Testing)**

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Settings**
4. Find **"Enable email confirmations"**
5. **Turn OFF** email confirmations
6. Save the settings

### 🔧 **Solution 2: Add Domain to Allowed List**

1. In **Authentication** → **Settings**
2. Find **"Site URL"** and set it to: `http://localhost:3000`
3. Find **"Additional Redirect URLs"** and add: `http://localhost:3000`
4. Save the settings

### 🔧 **Solution 3: Check Email Domain Restrictions**

1. In **Authentication** → **Settings**
2. Look for **"Email Domain Restrictions"** or **"Allowed Email Domains"**
3. Make sure your test domains are allowed, or remove restrictions temporarily

### 🔧 **Solution 4: Use a Real Email for Testing**

Instead of test emails, use a real email address you can access:
- Use your actual email address
- Check your inbox for confirmation emails
- Click the confirmation link if needed

## 🧪 **Test with Real Email**

Try signing up with your actual email address in the app:

1. Open http://localhost:3000
2. Click the profile icon (👤)
3. Click "Sign up"
4. Use your real email address
5. Check your email for confirmation (if enabled)

## 🔍 **Check Project Status**

Make sure your Supabase project is:
- ✅ Active and not paused
- ✅ Has proper billing setup (if required)
- ✅ Has the correct API keys

## 📞 **If Issues Persist**

If you continue having issues:

1. **Check Supabase Status**: https://status.supabase.com/
2. **Verify API Keys**: Make sure you're using the correct anon key
3. **Check Project Settings**: Ensure all authentication settings are correct
4. **Try a Different Email**: Use a Gmail, Yahoo, or other major email provider

## 🎯 **Expected Behavior After Fix**

Once you fix the email settings:
- ✅ Sign up should work with real email addresses
- ✅ Sign in should work immediately (if email confirmation is disabled)
- ✅ Profile creation should work
- ✅ Post creation should work
- ✅ No more 401/400 errors

Let me know what you find in your Supabase authentication settings!


