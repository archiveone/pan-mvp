# ⚡ UPLOAD QUICK ANSWERS

## 🎯 **Direct Answers to Your Questions**

---

## Q1: **Where do users upload?**

### **A: The UploadWizard Component**

**Location:** `components/UploadWizard.tsx`

**How to Access:**
1. Click the **"+"** button in bottom navigation
2. Click **"Create"** button in header
3. Click **"Add Content"** on profile page

**What Opens:**
- 5-step wizard modal
- Guides through entire upload process
- Handles ALL content types

---

## Q2: **How do users upload music?**

### **A: Via UploadWizard (5 Steps)**

```
User clicks [+] Create
  ↓
STEP 1: Select "Music & Audio"
  ↓
STEP 2: Enter title, artist, description
  ↓
STEP 3: Upload audio files
  - Can upload MULTIPLE .mp3 files (full album!)
  - Upload cover art (album artwork)
  ↓
STEP 4: Set genre, price, licensing
  - Genre: Rock, Pop, Jazz, etc.
  - Price: $1.99 per song or $9.99 for album
  - Download/Streaming options
  ↓
STEP 5: Review & Publish
  ✅ Saved to music_posts table
  ✅ Appears in feed
  ✅ Streamable/downloadable
```

**Code Behind:**
```typescript
// UploadWizard automatically:
1. Uploads audio files to Supabase Storage
2. Creates music_posts entry with audio_urls array
3. Sets price, genre, licensing
4. Publishes to feed
```

---

## Q3: **How to upload hotel with different rooms?**

### **A: Two Methods**

### **METHOD 1: Quick Setup (Easiest)** ✅

```typescript
import { ReservationService } from '@/services/reservationService'

// Creates hotel with default rooms in 1 line:
const hotel = await ReservationService.quickSetupBusiness(userId, {
  business_type: 'hotel',
  business_name: 'Grand Hotel',
  city: 'Miami',
  country: 'USA',
  address: '123 Ocean Dr'
}, {
  createResources: true,
  resourceCount: 10 // Creates 10 default rooms
})

// ✅ AUTO-CREATED: Rooms 101-110
```

### **METHOD 2: Custom Room Types** ✅

```typescript
import { AdvancedListingService } from '@/services/advancedListingService'

// 1. Create hotel listing
const hotel = await AdvancedListingService.createListing(userId, {
  listing_type: 'hotel',
  title: 'Luxury Beach Resort',
  has_variants: true // ← KEY!
})

// 2. Add room type variants
const deluxe = await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Deluxe Ocean View',
  base_price: 250,
  pricing_model: 'per_night',
  quantity_total: 20, // 20 deluxe rooms
  quantity_available: 20,
  attributes: {
    beds: 'King',
    view: 'Ocean',
    size: 450,
    amenities: ['Balcony', 'Mini bar']
  }
})

const suite = await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Presidential Suite',
  base_price: 750,
  quantity_total: 3, // Only 3 suites
  attributes: {
    beds: 'King + Queen',
    size: 1200,
    amenities: ['Living room', 'Kitchen', 'Jacuzzi']
  }
})

// ✅ Result: Hotel with 2 room types (23 total rooms)
```

**Where in UI:**
```
Current: Use code above
Future: Add variant manager to UploadWizard
```

---

## Q4: **How to create event with different tickets?**

### **A: Use AdvancedEventsService**

```typescript
import { AdvancedEventsService } from '@/services/advancedEventsService'

const festival = await AdvancedEventsService.createEvent(userId, {
  title: 'Summer Music Festival',
  description: '3-day outdoor festival',
  category: 'Music',
  event_type: 'in-person',
  
  start_date: '2024-07-15T14:00:00Z',
  end_date: '2024-07-17T23:00:00Z',
  venue_name: 'Golden Gate Park',
  city: 'San Francisco',
  country: 'USA',
  
  // Multiple ticket tiers! ←
  ticket_tiers: [
    {
      id: 'general',
      name: 'General Admission',
      description: 'Full 3-day access',
      price: 150,
      quantity: 2000,
      available: 2000
    },
    {
      id: 'vip',
      name: 'VIP Pass',
      description: 'VIP lounge + preferred viewing',
      price: 350,
      quantity: 200,
      available: 200
    },
    {
      id: 'backstage',
      name: 'Backstage Pass',
      description: 'VIP + backstage access',
      price: 750,
      quantity: 50,
      available: 50
    }
  ],
  
  total_capacity: 2250
})

// ✅ Event created with 3 ticket types!
```

**Customers See:**
```
Event Page:
  Title: Summer Music Festival
  Date: July 15-17
  
  Ticket Options:
  - General Admission: $150 (2000 available)
  - VIP Pass: $350 (200 available)
  - Backstage Pass: $750 (50 available)
  
  [Select Ticket & Buy]
```

---

## 📊 **Complete Matrix**

| Content Type | Upload Location | Multi-Variant Method | Example |
|--------------|-----------------|----------------------|---------|
| **Music** | UploadWizard | Multiple audio files | Album with 10 songs |
| **Hotel** | AdvancedListingService | createVariant() | 3 room types, 50 total rooms |
| **Event** | AdvancedEventsService | ticket_tiers array | 4 ticket types |
| **Product** | UploadWizard | createVariant() | T-shirt: S, M, L, XL |
| **Restaurant** | ReservationService | createResource() | 15 tables + 1 private room |
| **Salon** | ReservationService | createService() | 10 different services |

---

## 🚀 **Practical Code Examples**

### **Upload Music Album (Full):**

```typescript
// User fills UploadWizard, wizard handles this:

// 1. Upload audio files
const audioUploads = await Promise.all(
  audioFiles.map(file => 
    ImageService.uploadImage(file, 'media', 'audio')
  )
)
const audioUrls = audioUploads.map(u => u.url)

// 2. Upload cover art
const coverUpload = await ImageService.uploadImage(
  coverArtFile, 'media', 'images'
)

// 3. Create music post
await RichMediaService.createMusicPost(userId, {
  title: "Summer Vibes Album",
  artist: "The Band",
  audio_url: audioUrls[0],
  audio_urls: audioUrls, // All 10 tracks!
  cover_image_url: coverUpload.url,
  genre: "Indie",
  price: 9.99,
  is_saveable: true
})

// ✅ Done! Album with 10 songs published
```

### **Set Up Hotel with Rooms (Full):**

```typescript
// 1. Create hotel (1 line)
const hotel = await AdvancedListingService.createListing(userId, {
  listing_type: 'hotel',
  title: 'Seaside Resort',
  city: 'Miami',
  country: 'USA',
  has_variants: true
})

// 2. Add room types (3 lines)
const roomTypes = [
  { name: 'Standard', price: 150, qty: 50 },
  { name: 'Deluxe', price: 250, qty: 30 },
  { name: 'Suite', price: 500, qty: 10 }
]

for (const room of roomTypes) {
  await AdvancedListingService.createVariant({
    parent_listing_id: hotel.id,
    variant_type: 'room',
    name: room.name,
    base_price: room.price,
    pricing_model: 'per_night',
    quantity_total: room.qty,
    quantity_available: room.qty
  })
}

// ✅ Hotel with 90 bookable rooms across 3 types!
```

### **Create Event with Tickets (Full):**

```typescript
// Single function call:
const event = await AdvancedEventsService.createEvent(userId, {
  title: 'Tech Conference 2024',
  description: '3-day conference with workshops',
  category: 'Technology',
  event_type: 'in-person',
  start_date: '2024-06-15T09:00:00Z',
  end_date: '2024-06-17T18:00:00Z',
  venue_name: 'Convention Center',
  city: 'San Francisco',
  country: 'USA',
  
  // Multiple ticket tiers in one go!
  ticket_tiers: [
    {
      id: 'student',
      name: 'Student Ticket',
      price: 99,
      quantity: 200,
      description: 'Valid student ID required'
    },
    {
      id: 'general',
      name: 'General Admission',
      price: 299,
      quantity: 800
    },
    {
      id: 'vip',
      name: 'VIP All Access',
      price: 599,
      quantity: 100,
      description: 'Includes workshops + networking dinner'
    }
  ],
  
  total_capacity: 1100
})

// ✅ Event with 3 ticket types created!
```

---

## 💡 **Where Everything is Saved**

### **Music:**
```
Table: music_posts
Fields:
  - audio_url (primary track)
  - audio_urls (array of all tracks for album)
  - cover_image_url
  - genre, price, duration
```

### **Hotel:**
```
Table: advanced_listings (main hotel)
  - title, description, city
  - has_variants: true

Table: listing_variants (each room type)
  - name: "Deluxe Ocean View"
  - quantity_total: 20
  - base_price: 250
  - attributes: {beds, view, size}
```

### **Event:**
```
Table: advanced_events
Fields:
  - title, description, dates
  - ticket_tiers: [
      {name, price, quantity},
      {name, price, quantity},
      ...
    ]
  - total_capacity
```

---

## 🎨 **UI Flow Diagram**

```
User Journey:

[Homepage]
    ↓
Click [+] Button
    ↓
┌─────────────────────────────────┐
│ UploadWizard Modal Opens        │
│                                 │
│ Step 1: Choose Type             │
│  ○ Post  ○ Music  ○ Event      │
│  ○ Hotel ○ Product             │
│                                 │
│ [Next] →                        │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Step 2: Basic Info              │
│  Title: [____________]          │
│  Description: [_______]         │
│  Category: [v]                  │
│                                 │
│ [Back] [Next] →                 │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Step 3: Upload Files            │
│  Drag & Drop or Browse          │
│  ┌─────────────────┐            │
│  │ Drop files here │            │
│  └─────────────────┘            │
│  ✅ file1.mp3                   │
│  ✅ file2.mp3                   │
│                                 │
│ [Back] [Next] →                 │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Step 4: Type-Specific Details   │
│  (Dynamic based on type)        │
│                                 │
│  If Music:                      │
│    Genre, Price, Licensing      │
│  If Event:                      │
│    Date, Venue, Tickets         │
│  If Hotel:                      │
│    Rooms, Pricing, Amenities    │
│                                 │
│ [Back] [Next] →                 │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Step 5: Review                  │
│  Preview all details            │
│  ✅ Title                       │
│  ✅ Files uploaded              │
│  ✅ Price set                   │
│                                 │
│        [Publish] →              │
└─────────────────────────────────┘
    ↓
  ✅ SUCCESS!
  → Redirects to content page
  → Appears in unified feed
```

---

## 🎵 **Music Upload - Complete Example**

### **User fills UploadWizard:**

```
Step 1: Select "Music"
Step 2: 
  Title: "Midnight Sessions"
  Artist: "John Doe"
  Description: "Late night jazz album"
  
Step 3: Upload files
  Audio files:
    [Upload] → Select 8 .mp3 files
    ✅ 01-intro.mp3
    ✅ 02-smooth-jazz.mp3
    ✅ 03-blue-notes.mp3
    ✅ 04-sax-solo.mp3
    ✅ 05-midnight-vibe.mp3
    ✅ 06-slow-jam.mp3
    ✅ 07-upbeat-swing.mp3
    ✅ 08-outro.mp3
    
  Cover art:
    [Upload] → album-cover.jpg
    
Step 4: Music Details
  Genre: Jazz
  Price: $7.99 (full album)
  Currency: USD
  License: Non-exclusive
  ☑ Download enabled
  ☑ Streaming enabled
  ☑ Preview enabled
  
Step 5: Review
  ✅ 8 tracks
  ✅ Cover art
  ✅ $7.99
  [Publish Album]
```

**What Happens:**
1. Wizard uploads 8 audio files to Supabase Storage
2. Uploads cover art
3. Creates music_posts entry:
   ```json
   {
     "title": "Midnight Sessions",
     "artist": "John Doe",
     "audio_url": "01-intro.mp3",
     "audio_urls": ["01-intro.mp3", ..., "08-outro.mp3"],
     "cover_image_url": "album-cover.jpg",
     "genre": "Jazz",
     "price": 7.99
   }
   ```
4. Publishes to unified feed
5. Users can stream/download entire album!

---

## 🏨 **Hotel Upload - Complete Example**

### **Option A: Super Quick (Auto-setup)**

```typescript
// Literally 3 lines of code:
const hotel = await ReservationService.quickSetupBusiness(userId, {
  business_type: 'hotel',
  business_name: 'Beach Paradise Hotel',
  city: 'Miami',
  country: 'USA',
  address: '456 Beach Blvd'
}, {
  createResources: true,
  resourceCount: 20 // Auto-creates 20 rooms
})

// ✅ DONE! Hotel with 20 rooms ready for bookings
```

### **Option B: Custom Room Types**

```typescript
// 1. Create hotel
const hotel = await AdvancedListingService.createListing(userId, {
  listing_type: 'hotel',
  title: 'Grand Seaside Resort',
  description: '5-star luxury beachfront hotel',
  city: 'Miami',
  country: 'USA',
  has_variants: true,
  amenities: ['Pool', 'Spa', 'Restaurant']
})

// 2. Add Standard Rooms
await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Standard Room - City View',
  description: 'Comfortable room with city views',
  base_price: 150,
  pricing_model: 'per_night',
  quantity_total: 30, // 30 standard rooms
  quantity_available: 30,
  attributes: {
    bedType: 'Queen',
    view: 'City',
    size_sqft: 300,
    amenities: ['WiFi', 'TV', 'Coffee maker']
  },
  images: ['standard-room.jpg']
})

// 3. Add Deluxe Rooms
await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Deluxe Ocean View',
  base_price: 300,
  pricing_model: 'per_night',
  quantity_total: 15,
  quantity_available: 15,
  attributes: {
    bedType: 'King',
    view: 'Ocean',
    size_sqft: 450,
    amenities: ['WiFi', 'TV', 'Mini bar', 'Balcony']
  }
})

// 4. Add Suites
await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Presidential Suite',
  base_price: 800,
  pricing_model: 'per_night',
  quantity_total: 3,
  quantity_available: 3,
  attributes: {
    bedType: 'King + Queen',
    view: 'Panoramic Ocean',
    size_sqft: 1200,
    amenities: ['Living room', 'Kitchen', 'Jacuzzi', 'Butler']
  }
})

// ✅ Result:
// Hotel with 48 total rooms:
// - 30 Standard ($150/night)
// - 15 Deluxe ($300/night)
// - 3 Suites ($800/night)
```

**Customer Booking:**
```typescript
// Customer sees hotel in feed
// Clicks hotel → sees room types
// Selects "Deluxe Ocean View"
// Picks dates: June 15-18 (3 nights)
// Books for $900 total
```

---

## 🎫 **Event Upload - Complete Example**

### **Via Service:**

```typescript
const concert = await AdvancedEventsService.createEvent(userId, {
  title: 'Rock Concert 2024',
  description: 'Epic night of rock music',
  category: 'Music',
  event_type: 'in-person',
  
  start_date: '2024-08-15T19:00:00Z',
  end_date: '2024-08-15T23:00:00Z',
  
  venue_name: 'Madison Square Garden',
  address: 'New York, NY',
  city: 'New York',
  country: 'USA',
  
  cover_image_url: 'concert-poster.jpg',
  
  // MULTIPLE TICKET TYPES:
  ticket_tiers: [
    {
      id: 'nosebleed',
      name: 'Upper Level',
      description: 'Upper level seating',
      price: 50,
      quantity: 2000,
      available: 2000
    },
    {
      id: 'floor',
      name: 'Floor Seats',
      description: 'Ground level, close to stage',
      price: 150,
      quantity: 500,
      available: 500
    },
    {
      id: 'pit',
      name: 'Mosh Pit',
      description: 'General admission pit area',
      price: 100,
      quantity: 300,
      available: 300
    },
    {
      id: 'vip',
      name: 'VIP Package',
      description: 'Meet & greet + merch + front row',
      price: 500,
      quantity: 50,
      available: 50
    }
  ],
  
  total_capacity: 2850,
  is_free: false
})

// ✅ Event with 4 ticket types created!
```

---

## 📱 **Where to Add in UI**

### **Current Upload Options in TypeSelectionStep:**
- ✅ Post
- ✅ Listing (products)
- ✅ Event
- ✅ Music
- ✅ Rental
- ✅ Service
- ✅ Experience
- ✅ Group

### **Should Add:**
- 🔄 Auction
- 🔄 Fundraiser
- 🔄 Reservation Business (restaurant/salon/hotel)
- 🔄 Auction Sale (Sotheby's-level)

### **Should Add in Event Details:**
- 🔄 Ticket Tier Builder (add/remove ticket types)

### **Should Add in Rental Details:**
- 🔄 Room Variant Manager (add/remove room types)

---

## 🎯 **Bottom Line**

### **Music:**
✅ **Where:** UploadWizard → Music type
✅ **How:** Upload multiple .mp3 files
✅ **Result:** Full album with all tracks
✅ **Status:** WORKS NOW

### **Hotel:**
✅ **Where:** Service API (AdvancedListingService)
✅ **How:** Create listing → Add variants for each room type
✅ **Result:** Hotel with multiple room types
✅ **Status:** WORKS NOW (via code)
🔄 **UI:** Need to add variant manager to UploadWizard

### **Event:**
✅ **Where:** Service API (AdvancedEventsService)
✅ **How:** Create event with ticket_tiers array
✅ **Result:** Event with multiple ticket types
✅ **Status:** WORKS NOW (via code)
🔄 **UI:** Need to add ticket tier builder to EventDetailsStep

---

## 🚀 **Quick Test**

### **Test Music Upload:**
```typescript
// In browser console:
const { RichMediaService } = await import('@/services/richMediaService')
await RichMediaService.createMusicPost(userId, {
  title: "Test Song",
  artist: "Test Artist",
  audio_url: "test.mp3",
  genre: "Rock",
  price: 0.99
})
// ✅ Creates music post!
```

### **Test Hotel Creation:**
```typescript
const { AdvancedListingService } = await import('@/services/advancedListingService')
const hotel = await AdvancedListingService.createListing(userId, {
  listing_type: 'hotel',
  title: "Test Hotel",
  city: "Test City",
  country: "USA",
  has_variants: true
})
// ✅ Creates hotel!
```

---

## ✨ **Summary**

**Upload Location:** `components/UploadWizard.tsx` (main UI entry point)

**How It Works:**
1. User clicks Create
2. Wizard opens (5 steps)
3. Upload files (images/audio/video)
4. Set type-specific details
5. Publish!

**Multi-Variant Systems:**
- **Music:** Multiple files in MediaUploadStep
- **Hotel:** Variant system (service API)
- **Events:** Ticket tiers (JSONB array)

**Everything works via services - UI just needs enhancement for variants/tiers!** ✅
