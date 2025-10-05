# Fix Supabase Email Restrictions

## Immediate Solution for Development:

### 1. Disable Email Confirmation
Go to your Supabase Dashboard → Authentication → Settings:

- **Turn OFF "Enable email confirmations"**
- **Turn OFF "Enable phone confirmations"** 
- **Turn OFF "Enable email change confirmations"**

### 2. Update Auth Settings
In Authentication → Settings, set:
- **Site URL**: `http://localhost:3001` (your dev server)
- **Redirect URLs**: Add `http://localhost:3001/**`

### 3. For Production Later
When you're ready for production:
- Enable email confirmations
- Set up a custom SMTP provider (SendGrid, Mailgun, etc.)
- Use proper email validation

## Alternative: Use Magic Link Authentication
You can also switch to magic link authentication which doesn't require email confirmation.

## Test Your App Now
With email confirmations disabled, your app should work perfectly for development!
