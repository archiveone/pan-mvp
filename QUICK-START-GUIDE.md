# 🚀 Quick Start Guide - PAN Platform

## What You Have Now

PAN is a **complete marketplace ecosystem** supporting:

1. **Rentals** - Vehicles, equipment, property
2. **Events** - Concerts, festivals, workshops
3. **Bookings** - Restaurants, hotels, appointments
4. **Sales** - Products and services
5. **Auctions** - Bidding system
6. **Fundraisers** - Crowdfunding campaigns
7. **Streaming** - Music, video, live streams

---

## 🗄️ Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Supabase

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Run Database Migrations

Go to **Supabase Dashboard → SQL Editor** and run these files **in order**:

**Essential Migrations:**
```sql
1. supabase/migrations/notifications_final.sql
2. supabase/migrations/100_advanced_features.sql
3. supabase/migrations/101_ultra_advanced_listings.sql
4. supabase/migrations/103_analytics_system.sql
5. supabase/migrations/104_advanced_analytics.sql
6. supabase/migrations/106_auctions_and_fundraisers.sql ⭐ NEW
```

**Optional (but recommended):**
```sql
- 102_verified_profiles_and_notifications.sql
- 105_user_preferences.sql
- add_followers_system.sql
- add_engagement_tables.sql
```

### Step 4: Start Dev Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🎯 Feature Usage

### 1. **Creating Rentals**

```typescript
import { AdvancedListingService } from '@/services/advancedListingService';

// Create a vehicle rental
const listing = await AdvancedListingService.createListing(userId, {
  listing_type: 'vehicle_rental',
  title: '2023 Tesla Model 3',
  description: 'Electric car for rent',
  city: 'San Francisco',
  country: 'USA',
  has_variants: true, // Multiple vehicles
  shipping_available: false,
  category: 'Vehicles'
});

// Add vehicle variant
const variant = await AdvancedListingService.createVariant({
  parent_listing_id: listing.id,
  variant_type: 'vehicle',
  name: 'Tesla Model 3 - White',
  base_price: 75.00,
  pricing_model: 'per_day',
  quantity_total: 1,
  quantity_available: 1,
  attributes: {
    color: 'White',
    year: 2023,
    transmission: 'Automatic',
    seats: 5
  }
});
```

### 2. **Creating Events**

```typescript
import { AdvancedEventsService } from '@/services/advancedEventsService';

const event = await AdvancedEventsService.createEvent(userId, {
  title: 'Summer Music Festival',
  description: '3-day outdoor music festival',
  category: 'Music',
  event_type: 'in-person',
  start_date: '2024-07-15T14:00:00Z',
  end_date: '2024-07-17T23:00:00Z',
  venue_name: 'Golden Gate Park',
  city: 'San Francisco',
  country: 'USA',
  is_free: false,
  ticket_tiers: [
    { name: 'General Admission', price: 150, quantity: 1000 },
    { name: 'VIP', price: 350, quantity: 100 }
  ],
  total_capacity: 1100
});
```

### 3. **Creating Auctions** ⭐ NEW

```typescript
import { AuctionService } from '@/services/auctionService';

const auction = await AuctionService.createAuction(userId, {
  title: 'Vintage Guitar - 1965 Fender Stratocaster',
  description: 'Rare vintage guitar in excellent condition',
  category: 'Musical Instruments',
  condition: 'good',
  starting_price: 1000,
  reserve_price: 2500, // Won't sell below this
  buy_now_price: 5000, // Instant buy option
  min_bid_increment: 50,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  auto_extend: true, // Extend if bid in last 5 min
  shipping_available: true,
  shipping_cost: 50,
  images: ['url1.jpg', 'url2.jpg'],
  tags: ['vintage', 'guitar', 'fender']
});

// Place a bid
const bid = await AuctionService.placeBid(bidderId, {
  auction_id: auction.id,
  bid_amount: 1100,
  is_auto_bid: true, // Proxy bidding
  max_auto_bid: 2000 // Auto-bid up to this amount
});
```

### 4. **Creating Fundraisers** ⭐ NEW

```typescript
import { FundraiserService } from '@/services/fundraiserService';

const fundraiser = await FundraiserService.createFundraiser(userId, {
  title: 'Help Build Community Garden',
  tagline: 'Growing together for a greener tomorrow',
  story: 'We want to transform an empty lot into a thriving community garden...',
  category: 'Environment',
  campaign_type: 'reward', // or 'donation', 'all_or_nothing'
  goal_amount: 25000,
  currency: 'USD',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  has_rewards: true,
  min_contribution: 5,
  country: 'USA',
  city: 'Portland',
  tags: ['environment', 'community', 'garden']
});

// Add reward tiers
const reward1 = await FundraiserService.createReward({
  fundraiser_id: fundraiser.id,
  title: 'Garden Supporter',
  description: 'Your name on the community board + thank you email',
  amount: 25,
  shipping_required: false
});

const reward2 = await FundraiserService.createReward({
  fundraiser_id: fundraiser.id,
  title: 'Seed Starter Kit',
  description: 'Name on board + organic seed starter kit shipped to you',
  amount: 50,
  quantity_available: 100,
  is_limited: true,
  shipping_required: true,
  estimated_delivery_date: '2024-06-01'
});

// Create contribution
const contribution = await FundraiserService.createContribution(
  contributorId,
  {
    fundraiser_id: fundraiser.id,
    reward_id: reward2.id,
    amount: 50,
    contributor_message: 'Great initiative!',
    shipping_address: {
      street: '123 Main St',
      city: 'Portland',
      state: 'OR',
      postal_code: '97201',
      country: 'USA'
    },
    payment_method: 'card'
  }
);
```

### 5. **Booking System**

```typescript
import { BookingService } from '@/services/bookingService';

// Restaurant reservation
const booking = await BookingService.createBooking({
  listing_id: restaurantId,
  guest_id: userId,
  host_id: restaurantOwnerId,
  check_in: '2024-06-15',
  check_out: '2024-06-15',
  nights: 1, // Not applicable for restaurants, but required
  num_guests: 4,
  num_adults: 4,
  guest_message: 'Anniversary dinner, window seat if possible',
  base_price: 0, // Free reservation
  service_fee: 0,
  total_price: 0
});
```

### 6. **Streaming Content**

```typescript
import { StreamingService } from '@/services/streamingService';

// Start live stream
const stream = await StreamingService.startLiveStream(userId, {
  title: 'Live Music Performance',
  description: 'Join me for an acoustic set',
  stream_key: 'unique-stream-key-123',
  stream_url: 'rtmp://your-streaming-server.com/live',
  playback_url: 'https://your-streaming-server.com/play/stream-key-123'
});

// Or upload music
import { RichMediaService } from '@/services/richMediaService';

const musicPost = await RichMediaService.createMusicPost(userId, {
  title: 'Sunset Dreams',
  artist: 'John Doe',
  album: 'Summer Vibes',
  audio_url: 'https://storage.url/sunset-dreams.mp3',
  cover_image_url: 'https://storage.url/cover.jpg',
  duration: 245, // seconds
  genre: 'Indie Rock'
});
```

---

## 🔥 Key Services

All ready to use:

| Service | File | Purpose |
|---------|------|---------|
| Auctions ⭐ | `auctionService.ts` | Bidding, watching, closing |
| Fundraisers ⭐ | `fundraiserService.ts` | Campaigns, rewards, contributions |
| Advanced Listings | `advancedListingService.ts` | Rentals, hotels, venues |
| Events | `advancedEventsService.ts` | Ticketing, registration |
| Bookings | `bookingService.ts` | Reservations |
| Streaming | `streamingService.ts` | Live streams |
| Rich Media | `richMediaService.ts` | Music, video |
| Payments | `stripeService.ts` | Stripe integration |
| Analytics | `advancedAnalyticsService.ts` | Dashboards |

---

## 📱 Next Steps

### **Option A: Use Existing UI**

Integrate auctions/fundraisers into your existing pages:
- Add "Auction" and "Fundraiser" to post type selection
- Show auctions in the feed alongside other content
- Display fundraisers in the marketplace

### **Option B: Create Dedicated Pages**

Build specialized pages:
1. `/auctions` - Browse all auctions
2. `/auctions/[id]` - Auction detail + bidding
3. `/fundraisers` - Browse campaigns
4. `/fundraisers/[id]` - Campaign detail + contribute
5. `/dashboard/my-auctions` - Seller dashboard
6. `/dashboard/my-campaigns` - Campaign creator dashboard

### **Option C: Start Simple**

1. Test auction system:
   ```bash
   # In your browser console
   const { AuctionService } = await import('@/services/auctionService');
   const auctions = await AuctionService.getLiveAuctions();
   console.log(auctions);
   ```

2. Test fundraiser system:
   ```bash
   const { FundraiserService } = await import('@/services/fundraiserService');
   const campaigns = await FundraiserService.getActiveFundraisers();
   console.log(campaigns);
   ```

---

## 🎉 You're All Set!

PAN now has:
- ✅ Complete backend infrastructure
- ✅ Database schema (60+ tables)
- ✅ TypeScript types
- ✅ Service layer (50+ services)
- ✅ Analytics & insights
- ✅ Payment processing ready
- ✅ Row-level security
- ✅ Real-time subscriptions

**Start building your UI and launch!** 🚀

