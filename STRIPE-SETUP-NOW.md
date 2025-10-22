# 💳 Stripe Setup - Step by Step (5 Minutes)

## 🎯 Goal:
Enable real payments for your marketplace, tickets, and bookings!

---

## 📋 Step-by-Step Instructions:

### **Step 1: Create Stripe Account** (2 min)

1. **Go to:** https://dashboard.stripe.com/register
2. **Sign up** with your email
3. **Skip** business details for now (can add later)
4. **Click** "Skip for now" on any optional steps
5. You'll land on the Stripe Dashboard

---

### **Step 2: Get Your Test API Keys** (1 min)

1. **In Stripe Dashboard**, look for "Developers" in the left sidebar
2. **Click:** Developers → API keys
3. **Or go directly to:** https://dashboard.stripe.com/test/apikeys

You'll see two keys:

#### **Publishable key** (Safe to expose)
```
pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
**Copy this!** ← You'll need it

#### **Secret key** (Keep private!)
```
sk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
**Click "Reveal test key"**, then **Copy this!** ← You'll need it

---

### **Step 3: Add to Your Local Environment** (1 min)

**Open:** `.env.local` in your project (or create it if it doesn't exist)

**Add these lines:**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

**Replace** `YOUR_KEY_HERE` with the actual keys you copied!

**Save the file!**

---

### **Step 4: Add to Vercel** (1 min)

**Run these commands in your terminal:**

```bash
# Add publishable key
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# When prompted, paste: pk_test_YOUR_KEY

# Add secret key
vercel env add STRIPE_SECRET_KEY production

# When prompted, paste: sk_test_YOUR_KEY
```

**Note:** It will ask "Add to Preview?" → Say **Yes**  
It will ask "Add to Development?" → Say **Yes**

---

### **Step 5: Deploy to Vercel** (1 min)

```bash
vercel --prod
```

Wait for deployment to complete (~30 seconds)

---

### **Step 6: Restart Local Dev Server**

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ Verification - Is It Working?

### **Test Locally:**

1. **Open:** http://localhost:3000
2. **Open browser console** (F12)
3. **Type:** 
   ```javascript
   console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   ```
4. **Should show:** `pk_test_...` (your key)

If you see `undefined` → Keys not loaded, restart dev server  
If you see your key → ✅ Working!

### **Test Payment:**

1. **Create a marketplace item** with price (e.g., $10)
2. **Click on it** → View details
3. **Click "Buy Now"** or "Checkout"
4. **Fill in card info:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34` (any future date)
   - CVC: `123` (any 3 digits)
   - ZIP: `12345` (any 5 digits)
5. **Click "Pay"**
6. **Should succeed!** ✅

---

## 🎉 After Stripe is Configured:

### **✅ These Will Work:**

#### **Marketplace:**
- Buy physical products
- Secure checkout
- Order tracking
- Seller gets paid
- Inventory updates automatically

#### **Event Tickets:**
- Purchase tickets
- Get QR code instantly
- Check-in at event
- Ticket holder tracking

#### **Bookings:**
- Book stays/appointments
- Secure payment
- Confirmation codes
- Host/guest system

#### **Digital Content:**
- Buy music, videos, movies
- Auto-added to library
- Stream/download unlimited
- Access forever

---

## 🔍 Troubleshooting:

### **"Stripe is not defined" error:**
- Restart dev server
- Check `.env.local` file exists
- Verify keys are correct (no spaces, full key)

### **"Invalid API key" error:**
- Make sure you copied the FULL key
- Check for extra spaces
- Verify using TEST keys (pk_test_, sk_test_)

### **Checkout page shows loading forever:**
- Check browser console for errors
- Verify both keys are set
- Make sure secret key matches publishable key (same account)

---

## 💡 Pro Tips:

### **Test Mode vs Live Mode:**
- **Test keys** (pk_test_, sk_test_) → For testing, no real money
- **Live keys** (pk_live_, sk_live_) → Real transactions, real money

**Start with test mode!** Switch to live when ready for production.

### **Stripe Dashboard:**
After test purchases, check:
- https://dashboard.stripe.com/test/payments

You'll see all test transactions there!

---

## 🎊 After This Setup:

**Your app becomes:**
- ✅ Airbnb (bookings & stays)
- ✅ Dice (event tickets)
- ✅ Ticketmaster (ticketing system)
- ✅ Facebook Marketplace (buy/sell)
- ✅ Shopify (full e-commerce)
- ✅ Spotify (music library)
- ✅ YouTube (video platform)
- ✅ Kickstarter (fundraising)
- ✅ eBay (auctions)

**ALL IN ONE PLATFORM!** 🚀

---

## 📞 Ready?

1. Sign up for Stripe: https://dashboard.stripe.com/register
2. Get your test keys
3. Paste them into `.env.local`
4. Add to Vercel
5. Deploy
6. **You're live!**

**Let me know when you have your Stripe keys and I'll help you add them!**

