# 🛒 How to Use the Purchase System

## Quick Start

### 1. Add Purchase Button to Any Post

```tsx
import PurchaseButton from '@/components/PurchaseButton';

<PurchaseButton 
  post={post} 
  onSuccess={() => {
    console.log('Purchase complete!');
    // Refresh data, show confetti, etc.
  }}
/>
```

**That's it!** The button automatically:
- Shows "Get Free" for free content
- Shows "Buy $X.XX" for paid content
- Handles Stripe payment
- Calls `purchase_post()` function
- Adds to appropriate collection
- Redirects to library/tickets/bookings

---

## Examples

### Music Player with Purchase

```tsx
export default function MusicPost({ post }) {
  return (
    <div>
      <h2>{post.title}</h2>
      <audio src={post.metadata.audio_preview_url} />
      
      <PurchaseButton post={post} />
    </div>
  );
}
```

### Video with Free/Paid Toggle

```tsx
// Free trailer
{!post.is_for_sale && (
  <video src={post.media_url} />
)}

// Paid full video
{post.is_for_sale && (
  <div>
    <p>Watch full video for ${post.price_amount}</p>
    <PurchaseButton post={post} />
  </div>
)}
```

### Event Ticket

```tsx
<div>
  <h2>{post.title}</h2>
  <p>📅 {post.metadata.event_date}</p>
  <p>📍 {post.metadata.venue}</p>
  <p>🎫 {post.stock_quantity} tickets left</p>
  
  <PurchaseButton post={post} />
</div>
```

---

## Manual Purchase (Advanced)

```typescript
import { purchasePost } from '@/services/purchaseService';

const handleBuy = async () => {
  const result = await purchasePost({
    postId: '...',
    userId: user.id,
    amount: 9.99,
    metadata: {
      // Any extra data you want to store
      seat_preference: 'front row',
      gift_for: 'friend@email.com',
    }
  });
  
  console.log('Transaction ID:', result.transactionId);
};
```

---

## What Happens on Purchase?

### For Paid Content:
1. **Stripe Payment** → User pays
2. **Database Transaction** → Record created in `transactions` table
3. **Auto-add to Collection** → Added to appropriate system collection:
   - Music/Videos → "My Library"
   - Events → "My Tickets"
   - Bookings → "My Bookings"
   - Products → "My Purchases"
4. **Grant Access** → User can now access `digital_file_url`
5. **Decrease Stock** → `stock_quantity` decremented (if limited)

### For Free Content:
1. **No Payment** → Skip Stripe
2. **Add to Collection** → Added to "My Library"
3. **Immediate Access** → Can use right away

---

## Environment Variables Needed

```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## Checking if User Owns Content

```typescript
// Query collection_items to see if user purchased
const { data: owned } = await supabase
  .from('collection_items')
  .select('*')
  .eq('added_by', user.id)
  .eq('post_id', postId)
  .single();

if (owned) {
  // User owns this content
  <button>Play</button>
} else {
  // User doesn't own it
  <PurchaseButton post={post} />
}
```

---

## View User's Purchases

```typescript
// My Tickets
const { data: tickets } = await supabase
  .from('user_tickets')
  .eq('user_id', user.id);

// My Library
const { data: library } = await supabase
  .from('collection_items')
  .select('*, posts(*)')
  .eq('collection_id', libraryCollectionId);

// Or use the helper view
const { data: bookings } = await supabase
  .from('user_bookings')
  .eq('user_id', user.id);
```

---

## Transaction History

```typescript
// User's purchase history
const { data: purchases } = await supabase
  .from('transactions')
  .select('*, posts(title, media_url)')
  .eq('buyer_id', user.id)
  .order('created_at', { ascending: false });

// User's sales (if they're a seller)
const { data: sales } = await supabase
  .from('transactions')
  .select('*, posts(title)')
  .eq('seller_id', user.id);
```

---

## That's It!

The system handles:
✅ Payment processing (Stripe)  
✅ Transaction recording  
✅ Collection management  
✅ Access control  
✅ Inventory management  
✅ Free & paid content  

Just use `<PurchaseButton post={post} />` and you're done! 🎉

