# 🧪 How to Test Stripe Purchases

## 1. Create Test Content

Run **`TEST-PURCHASE-FLOW.sql`** in Supabase SQL Editor.

This creates:
- ✅ Free music single (test "Get Free" button)
- ✅ Paid music single ($0.99)
- ✅ Paid video ($4.99)
- ✅ Event ticket ($89)
- ✅ Music album ($9.99)

---

## 2. Add PurchaseButton to Listing Cards

Update your listing card to show the purchase button:

```tsx
// components/ListingCard.tsx or wherever you display posts
import PurchaseButton from '@/components/PurchaseButton';

// Inside your card component:
{post.is_for_sale && (
  <PurchaseButton post={post} />
)}
```

---

## 3. Test Stripe Payment (Test Mode)

### Stripe Test Card Numbers:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0027 6000 3184`

### Test Details:
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

---

## 4. Test Purchase Flow

1. **Go to homepage** → See test content
2. **Click "Buy Song $0.99"** on paid single
3. **Stripe payment modal appears**
4. **Enter test card:** `4242 4242 4242 4242`
5. **Complete payment**
6. **Should redirect to "/my-library"**
7. **Check collection** → Song should be there!

---

## 5. Verify in Database

```sql
-- Check transaction was created
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;

-- Check it was added to collection
SELECT 
  c.name as collection_name,
  p.title as post_title,
  ci.transaction_data
FROM collection_items ci
JOIN collections c ON ci.collection_id = c.id
JOIN posts p ON ci.post_id = p.id
ORDER BY ci.added_at DESC
LIMIT 5;
```

---

## 6. Test Free Content

1. **Click "Get Free"** on free song
2. **Should add to library immediately** (no payment)
3. **Check "/my-library"** → Should appear

---

## 7. Check Stripe Dashboard

**Go to:** https://dashboard.stripe.com/test/payments

You should see:
- Payment Intent created
- Charge successful
- Metadata includes `postId` and `userId`

---

## 8. Test Different Content Types

### Music ($0.99)
- Should go to "My Library"
- Can stream/download immediately

### Video ($4.99)
- Should go to "My Library"
- Can stream immediately

### Event Ticket ($89)
- Should go to "My Tickets"
- QR code generated in transaction_data

### Album ($9.99)
- Should go to "My Library"
- All tracks accessible

---

## 🎯 What Should Happen:

1. ✅ Stripe payment modal opens
2. ✅ Payment processes successfully
3. ✅ `purchase_post()` function runs
4. ✅ Transaction created in database
5. ✅ Post added to appropriate collection
6. ✅ Stock decremented (for events/limited items)
7. ✅ User redirected to collection page
8. ✅ Success message shown

---

## 🐛 Troubleshooting:

### "Payment Failed"
- Check Stripe keys are correct
- Verify keys are in `.env.local` AND Vercel env vars
- Check console for errors

### "purchase_post is not a function"
- Run `FIX-TRANSACTIONS-TABLE.sql` to create the function

### "Not added to collection"
- Run `CREATE-UNIFIED-COLLECTIONS-SYSTEM.sql`
- Check system collections exist for your user

### "No redirect after purchase"
- Check `/my-library`, `/my-tickets` pages exist
- Verify router is working

---

## ✅ Success Checklist:

- [ ] Test content created
- [ ] Purchase button shows on paid items
- [ ] "Get Free" button shows on free items
- [ ] Stripe modal opens on click
- [ ] Test card payment works
- [ ] Transaction appears in database
- [ ] Item added to collection
- [ ] Can access purchased content
- [ ] Stock decremented (for limited items)

---

## 🚀 When Ready for Production:

1. **Switch to Live Stripe Keys** in Vercel
2. **Test with real card** (small amount)
3. **Verify webhook setup** (for refunds, etc.)
4. **Enable in production**

You're ready! 🎉

