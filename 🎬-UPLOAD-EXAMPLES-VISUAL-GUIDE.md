# 🎬 UPLOAD EXAMPLES - VISUAL GUIDE

## 📍 **Where Users Upload: UploadWizard**

**Location:** `components/UploadWizard.tsx`
**Access:** Click any "Create" or "+" button in the app

---

## 🎵 **Example 1: Upload Music Album (10 Songs)**

### **User Journey:**

```
┌─────────────────────────────────────────────────┐
│ [+] Create Button Clicked                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ STEP 1: What would you like to create?         │
├─────────────────────────────────────────────────┤
│ [ ] Post         [ ] Listing      [✓] Music    │
│ [ ] Event        [ ] Rental       [ ] Service   │
│ [ ] Experience   [ ] Group                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ STEP 2: Basic Information                       │
├─────────────────────────────────────────────────┤
│ Title: "Summer Vibes - Complete Album"         │
│ Artist: "The Sunset Band"                       │
│ Description: "10-track indie rock album..."     │
│ Category: "Music" → "Indie Rock"               │
│ Tags: #indie #summer #album                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ STEP 3: Upload Media                            │
├─────────────────────────────────────────────────┤
│ Audio Files (Drag & Drop):                      │
│ ✅ 01-sunset-dreams.mp3                        │
│ ✅ 02-neon-nights.mp3                          │
│ ✅ 03-ocean-breeze.mp3                         │
│ ✅ 04-midnight-drive.mp3                       │
│ ✅ 05-golden-hour.mp3                          │
│ ✅ 06-starlight.mp3                            │
│ ✅ 07-beach-waves.mp3                          │
│ ✅ 08-summer-love.mp3                          │
│ ✅ 09-endless-sky.mp3                          │
│ ✅ 10-farewell-summer.mp3                      │
│                                                  │
│ Cover Art:                                       │
│ ✅ album-cover.jpg                             │
│                                                  │
│ Total: 10 tracks, 1 cover image                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ STEP 4: Music Details                           │
├─────────────────────────────────────────────────┤
│ Genre: Indie Rock                               │
│ Price: $9.99 (for full album)                   │
│ Currency: USD                                    │
│                                                  │
│ License Type:                                    │
│ [✓] Non-Exclusive (can sell to multiple)       │
│ [ ] Exclusive                                   │
│                                                  │
│ Distribution:                                    │
│ [✓] Download enabled                            │
│ [✓] Streaming enabled                           │
│ [✓] Preview enabled                             │
│                                                  │
│ Credits:                                         │
│ "Produced by: John Smith                        │
│  Mixed by: Jane Doe                             │
│  Mastered at: ABC Studios"                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ STEP 5: Review & Publish                        │
├─────────────────────────────────────────────────┤
│ ✅ Title: Summer Vibes - Complete Album        │
│ ✅ 10 Audio Files (45 MB total)                │
│ ✅ Cover Art                                    │
│ ✅ Price: $9.99                                 │
│ ✅ Download + Streaming enabled                 │
│                                                  │
│         [Publish Album] →                       │
└─────────────────────────────────────────────────┘
                    ↓
            ✅ PUBLISHED!
        
Saved to: music_posts table
{
  title: "Summer Vibes - Complete Album",
  artist: "The Sunset Band",
  audio_url: "01-sunset-dreams.mp3",
  audio_urls: ["01-sunset-dreams.mp3", ..., "10-farewell-summer.mp3"],
  cover_image_url: "album-cover.jpg",
  genre: "Indie Rock",
  price: 9.99
}

Appears in feed as streamable/downloadable album!
```

---

## 🏨 **Example 2: Upload Hotel with Different Rooms**

### **Two Methods:**

### **METHOD A: Via Upload Wizard (Coming Soon)**
```
Currently: Rental type creates basic listing
Upgrade Needed: Add variant manager to upload wizard
```

### **METHOD B: Via Service (Current Working Method)** ✅

```typescript
// Business owner uses service API:

// 1. Create hotel listing
const hotel = await AdvancedListingService.createListing(userId, {
  listing_type: 'hotel',
  title: 'Grand Seaside Resort',
  tagline: '5-Star Luxury by the Beach',
  description: 'Experience ultimate luxury...',
  category: 'Hotels',
  city: 'Miami',
  country: 'USA',
  address: '789 Ocean Drive',
  has_variants: true, // ← Enables room system!
  amenities: ['Pool', 'Spa', 'Restaurant', 'Gym', 'Beach access'],
  cover_image_url: 'hotel-exterior.jpg',
  gallery_images: ['lobby.jpg', 'pool.jpg', 'beach.jpg']
})

// 2. Add Room Type #1: Standard Rooms
const standardRoom = await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Standard Room',
  description: 'Comfortable room with city view',
  
  // Pricing
  base_price: 150.00,
  currency: 'USD',
  pricing_model: 'per_night',
  
  // Inventory
  quantity_total: 50, // 50 standard rooms
  quantity_available: 50,
  
  // Room attributes
  attributes: {
    bedType: 'Queen',
    view: 'City',
    size_sqft: 300,
    floor: '2-5',
    maxOccupancy: 2,
    amenities: ['TV', 'WiFi', 'Coffee maker', 'Safe']
  },
  
  // Media
  images: ['standard-room-1.jpg', 'standard-room-2.jpg'],
  primary_image_url: 'standard-room-main.jpg'
})

// 3. Add Room Type #2: Deluxe Ocean View
const deluxeRoom = await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Deluxe Ocean View',
  description: 'Spacious room with panoramic ocean views',
  
  base_price: 250.00,
  currency: 'USD',
  pricing_model: 'per_night',
  
  quantity_total: 30,
  quantity_available: 30,
  
  attributes: {
    bedType: 'King',
    view: 'Ocean',
    size_sqft: 450,
    floor: '6-10',
    maxOccupancy: 3,
    amenities: ['TV', 'WiFi', 'Mini bar', 'Balcony', 'Ocean view']
  },
  
  images: ['deluxe-ocean-1.jpg', 'deluxe-ocean-2.jpg', 'deluxe-balcony.jpg']
})

// 4. Add Room Type #3: Presidential Suite
const suite = await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Presidential Suite',
  description: 'Ultimate luxury with private terrace',
  
  base_price: 750.00,
  currency: 'USD',
  pricing_model: 'per_night',
  
  quantity_total: 5,
  quantity_available: 5,
  
  attributes: {
    bedType: 'King + Queen',
    view: 'Panoramic Ocean',
    size_sqft: 1200,
    floor: 'Penthouse',
    maxOccupancy: 6,
    amenities: [
      'Living room', 'Dining room', 'Full kitchen',
      'Jacuzzi', 'Private terrace', 'Butler service',
      'Premium bar', '2 bathrooms'
    ]
  },
  
  images: ['suite-1.jpg', 'suite-2.jpg', 'suite-living.jpg', 'suite-terrace.jpg']
})

// ✅ RESULT:
// Hotel with 3 room types
// - 50 Standard Rooms ($150/night)
// - 30 Deluxe Rooms ($250/night)
// - 5 Suites ($750/night)
// Total: 85 bookable rooms!
```

### **How Customers See It:**

```
┌─────────────────────────────────────────┐
│ Grand Seaside Resort ⭐⭐⭐⭐⭐         │
│ Miami, Florida                          │
├─────────────────────────────────────────┤
│ Choose Room Type:                       │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Standard Room            $150/night │ │
│ │ Queen bed • City view • 300 sq ft   │ │
│ │ 50 available                        │ │
│ │         [Book Now]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Deluxe Ocean View        $250/night │ │
│ │ King bed • Ocean view • 450 sq ft   │ │
│ │ 30 available                        │ │
│ │         [Book Now]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Presidential Suite       $750/night │ │
│ │ King + Queen • 1200 sq ft • Terrace │ │
│ │ 5 available                         │ │
│ │         [Book Now]                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🎫 **Example 3: Event with Multiple Ticket Types**

### **Via Upload Wizard:**

```
STEP 1: Select "Event" type

STEP 2: Basic Info
  title: "Summer Music Festival 2024"
  description: "3-day outdoor festival"
  category: "Music Festival"

STEP 3: Upload Media
  - Festival poster
  - Venue photos
  - Lineup graphics

STEP 4: Event Details
┌──────────────────────────────────────────┐
│ Date & Time:                             │
│  Start: July 15, 2024 @ 2:00 PM         │
│  End: July 17, 2024 @ 11:00 PM          │
│                                          │
│ Location:                                │
│  Venue: Golden Gate Park                 │
│  Address: San Francisco, CA              │
│                                          │
│ Capacity & Pricing:                      │
│  Total Capacity: 5000                    │
│  Ticket Price: $150 (base price)        │
│  Currency: USD                           │
└──────────────────────────────────────────┘

STEP 5: Publish!
```

### **Then Add Ticket Tiers (via service):**

```typescript
// After event is created, add detailed tiers
const event = await AdvancedEventsService.getEvent(eventId)

await AdvancedEventsService.updateEvent(eventId, {
  ticket_tiers: [
    {
      id: 'early_bird',
      name: 'Early Bird - 3-Day Pass',
      description: 'Save $50 with early bird pricing',
      price: 99,
      quantity: 500,
      available: 500,
      valid_from: '2024-03-01',
      valid_until: '2024-05-01' // Early bird ends May 1
    },
    {
      id: 'general',
      name: 'General Admission - 3-Day Pass',
      description: 'Full access to all 3 days',
      price: 150,
      quantity: 3000,
      available: 3000
    },
    {
      id: 'vip',
      name: 'VIP 3-Day Pass',
      description: 'VIP lounge, premium viewing, meet & greets',
      price: 350,
      quantity: 400,
      available: 400
    },
    {
      id: 'single_day',
      name: 'Single Day Pass',
      description: 'Choose any one day',
      price: 60,
      quantity: 1000,
      available: 1000
    },
    {
      id: 'backstage',
      name: 'Backstage Experience',
      description: 'VIP + backstage access + artist meet & greet',
      price: 750,
      quantity: 100,
      available: 100
    }
  ]
})
```

### **How Customers See It:**

```
┌──────────────────────────────────────────────────┐
│ Summer Music Festival 2024                       │
│ July 15-17 • Golden Gate Park                    │
├──────────────────────────────────────────────────┤
│ Select Ticket Type:                              │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ 🏷️ Early Bird 3-Day          $99         │  │
│ │ Save $51! Limited time offer               │  │
│ │ 347 remaining                              │  │
│ │                      [Select]              │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ 🎫 General Admission 3-Day    $150        │  │
│ │ Full festival access                       │  │
│ │ 2,847 remaining                            │  │
│ │                      [Select]              │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ ⭐ VIP 3-Day Pass            $350         │  │
│ │ VIP lounge + premium viewing               │  │
│ │ 287 remaining                              │  │
│ │                      [Select]              │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ 📅 Single Day Pass           $60          │  │
│ │ Choose Friday, Saturday, or Sunday         │  │
│ │ 934 remaining                              │  │
│ │                      [Select]              │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ 🎸 Backstage Experience      $750         │  │
│ │ VIP + backstage + meet artists             │  │
│ │ 67 remaining                               │  │
│ │                      [Select]              │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## 🏢 **Example 4: Restaurant/Salon (Detailed)**

### **Upload Flow:**

```typescript
// METHOD 1: Quick Setup (Recommended!) ✅

const restaurant = await ReservationService.quickSetupBusiness(userId, {
  business_type: 'restaurant',
  business_name: 'La Bella Cucina',
  description: 'Authentic Italian fine dining',
  phone: '+1-415-555-0100',
  email: 'reservations@labella.com',
  address: '123 Columbus Ave',
  city: 'San Francisco',
  country: 'USA',
  cuisine_types: ['Italian', 'Fine Dining'],
  amenities: ['Wine cellar', 'Private rooms', 'Outdoor seating']
}, {
  createResources: true, // Auto-create tables
  resourceCount: 12 // 12 tables
})

// ✨ AUTO-CREATED:
// ✅ Operating hours (11 AM - 10 PM)
// ✅ 12 tables (Table 1-12, seats 4 each)
// ✅ Slug: "la-bella-cucina"
// ✅ Instant booking enabled

// 3. Customize specific tables
await ReservationService.updateResource(table5Id, {
  name: 'Window Table 5',
  capacity: 2,
  features: ['Window view', 'Romantic', 'Quiet']
})

await ReservationService.createResource({
  business_id: restaurant.id,
  resource_type: 'table',
  name: 'Private Dining Room',
  capacity: 12,
  base_rate: 200.00, // Reservation fee for private room
  pricing_model: 'per_booking',
  features: ['Private', 'A/V equipment', 'Dedicated server'],
  requires_approval: true // Needs owner approval
})

// ✅ RESULT:
// Restaurant with 13 bookable tables:
// - 11 regular tables (2-4 seats)
// - 1 window table (2 seats, premium)
// - 1 private dining room (12 seats, requires approval)
```

---

## 🎨 **Code Examples for Each Type**

### **Upload Music:**
```typescript
// Via RichMediaService
await RichMediaService.createMusicPost(userId, {
  title: "Song Name",
  artist: "Artist Name",
  album: "Album Name",
  audio_url: "main-track.mp3",
  audio_urls: ["track1.mp3", "track2.mp3"], // For albums
  cover_image_url: "cover.jpg",
  duration: 245,
  genre: "Rock",
  price: 1.99
})
```

### **Upload Hotel:**
```typescript
// Step 1: Create hotel
const hotel = await AdvancedListingService.createListing(...)

// Step 2: Add each room type
await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Deluxe Suite',
  base_price: 300,
  quantity_total: 20,
  attributes: { bedType: 'King', size: 500 }
})
// Repeat for each room type
```

### **Upload Event:**
```typescript
// Single tier (simple)
await AdvancedEventsService.createEvent(userId, {
  title: "Concert",
  ticket_tiers: [{
    name: 'General',
    price: 50,
    quantity: 500
  }]
})

// Multi-tier (complex)
await AdvancedEventsService.createEvent(userId, {
  title: "Festival",
  ticket_tiers: [
    { name: 'Early Bird', price: 99, quantity: 500 },
    { name: 'General', price: 150, quantity: 3000 },
    { name: 'VIP', price: 350, quantity: 100 }
  ]
})
```

---

## 🎯 **Summary**

### **Where Upload Happens:**
📍 **Main Entry:** `components/UploadWizard.tsx` (5-step wizard)
📍 **Accessed Via:** Any "Create" or "+" button in app
📍 **Alternatives:** Direct service calls (for bulk/programmatic)

### **How Multi-Item Upload Works:**

| Type | Method | Where |
|------|--------|-------|
| **Music Album** | Upload multiple files | MediaUploadStep → audio_urls array |
| **Hotel Rooms** | Create variants after listing | AdvancedListingService.createVariant() |
| **Event Tickets** | ticket_tiers array | AdvancedEventsService (JSONB field) |
| **Product Sizes** | Create variants | listing_variants table |
| **Restaurant Tables** | Auto-create or manual | ReservationService.createResource() |

### **Database Storage:**

```
Music → music_posts.audio_urls (JSONB array)
Hotel → listing_variants (one row per room type)
Event → advanced_events.ticket_tiers (JSONB array)
Restaurant → reservation_resources (one row per table)
```

### **Current State:**
✅ **Music:** Full album upload supported
✅ **Hotel:** Variant system ready (needs UI component)
✅ **Event:** Multi-tier tickets supported
✅ **Restaurant:** Auto-setup with tables

### **Easy Improvements:**
🔄 Add VariantManagerStep to UploadWizard for hotels
🔄 Add TicketTierBuilder to EventDetailsStep
🔄 Add reservation_business to TypeSelectionStep

**The backend is 100% ready - just needs UI enhancements!** 🚀
