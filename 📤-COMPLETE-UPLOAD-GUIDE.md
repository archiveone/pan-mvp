# 📤 COMPLETE UPLOAD GUIDE

## 🎯 **Where & How Users Upload Content**

---

## 🎨 **Upload System Overview**

### **Location: UploadWizard Component**
- **File:** `components/UploadWizard.tsx`
- **Access:** Click "+" or "Create" button anywhere in the app
- **Flow:** 5-step wizard for ALL content types

---

## 🚀 **The Upload Flow (5 Steps)**

```
┌──────────────────────────────────────────────────┐
│  STEP 1: Choose Content Type                     │
│  (components/upload-steps/TypeSelectionStep.tsx) │
├──────────────────────────────────────────────────┤
│  Options:                                        │
│  📝 Post       🛍️ Listing     🎫 Event           │
│  🎵 Music      🏠 Rental      💼 Service         │
│  ⭐ Experience 👥 Group                          │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  STEP 2: Basic Information                       │
│  (components/upload-steps/BasicInfoStep.tsx)     │
├──────────────────────────────────────────────────┤
│  - Title *                                       │
│  - Description *                                 │
│  - Category *                                    │
│  - Tags                                          │
│  - Location                                      │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  STEP 3: Media Upload                            │
│  (components/upload-steps/MediaUploadStep.tsx)   │
├──────────────────────────────────────────────────┤
│  - Drag & drop or browse                         │
│  - Multiple images supported                     │
│  - Video upload                                  │
│  - Audio upload (for music)                      │
│  - Document upload (PDFs)                        │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  STEP 4: Type-Specific Details                   │
│  (Dynamic based on content type selected)        │
├──────────────────────────────────────────────────┤
│  See detailed breakdowns below ↓                 │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  STEP 5: Review & Publish                        │
│  (components/upload-steps/ReviewStep.tsx)        │
├──────────────────────────────────────────────────┤
│  - Preview your content                          │
│  - Review all details                            │
│  - Click "Publish"                               │
└──────────────────────────────────────────────────┘
```

---

## 🎵 **Example 1: Uploading Music**

### **User Flow:**

```typescript
// STEP 1: Select "Music & Audio" type
type: 'music'

// STEP 2: Basic Info
title: "Sunset Dreams"
description: "Chill indie track for summer vibes"
category: "Indie Rock"
tags: ["indie", "summer", "chill"]

// STEP 3: Media Upload
- Upload audio file (.mp3, .wav, .flac)
- Upload cover art (album art image)
- Can upload multiple tracks (for albums)

// STEP 4: Music Details
// (components/upload-steps/MusicDetailsStep.tsx)
genre: "Indie"
price: 2.99
currency: "USD"
licenseType: "non_exclusive"
downloadEnabled: true
streamingEnabled: true
previewEnabled: true
lyrics: "Optional lyrics..."
credits: "Produced by..."

// STEP 5: Review & Publish
✅ Published to music_posts table
```

### **Code Behind:**
```typescript
// UploadWizard handles the upload
const audioUploadResult = await ImageService.uploadImage(
  audioFile,
  'media',
  'audio'
)

// Saves to database
const result = await ContentService.createContent({
  ...uploadData,
  audio_url: audioUrls[0],
  audio_urls: audioUrls,
  content_type: 'music',
  genre,
  price,
  license_type: licenseType,
  download_enabled: downloadEnabled
})
```

---

## 🏨 **Example 2: Hotel with Different Rooms**

### **Current System - 2 Options:**

#### **Option A: Advanced Listing with Variants** (Best for hotels!)

```typescript
import { AdvancedListingService } from '@/services/advancedListingService'

// STEP 1: Create hotel listing
const hotel = await AdvancedListingService.createListing(userId, {
  listing_type: 'hotel',
  title: 'Seaside Resort & Spa',
  description: 'Luxury beachfront hotel',
  category: 'Accommodation',
  city: 'Miami',
  country: 'USA',
  address: '123 Ocean Drive',
  has_variants: true, // ← KEY: Enables room system
  amenities: ['Pool', 'Spa', 'Restaurant', 'Gym']
})

// STEP 2: Add room types (variants)
const deluxeRoom = await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Deluxe Ocean View',
  base_price: 250.00,
  pricing_model: 'per_night',
  quantity_total: 10, // 10 deluxe rooms
  quantity_available: 10,
  attributes: {
    bedType: 'King',
    view: 'Ocean',
    size_sqft: 450,
    amenities: ['Balcony', 'Mini bar', 'Coffee maker']
  },
  images: ['deluxe-room-1.jpg', 'deluxe-room-2.jpg']
})

const suiteRoom = await AdvancedListingService.createVariant({
  parent_listing_id: hotel.id,
  variant_type: 'room',
  name: 'Presidential Suite',
  base_price: 750.00,
  pricing_model: 'per_night',
  quantity_total: 2, // Only 2 suites
  quantity_available: 2,
  attributes: {
    bedType: 'King + Queen',
    view: 'Panoramic Ocean',
    size_sqft: 1200,
    amenities: ['Living room', 'Kitchen', 'Jacuzzi', 'Private terrace']
  },
  images: ['suite-1.jpg', 'suite-2.jpg']
})

// ✅ Result: Hotel with multiple room types!
// Customers can browse rooms and book specific types
```

#### **Option B: Reservation Business** (For booking system)

```typescript
import { ReservationService } from '@/services/reservationService'

// Quick setup hotel
const hotel = await ReservationService.quickSetupBusiness(userId, {
  business_type: 'hotel',
  business_name: 'Seaside Resort',
  city: 'Miami',
  country: 'USA',
  address: '123 Ocean Drive'
}, {
  createResources: true, // Auto-creates 5 rooms
  resourceCount: 10
})

// Rooms auto-created: Room 101-110

// Or manually add specific room types
const deluxeRoom = await ReservationService.createResource({
  business_id: hotel.id,
  resource_type: 'room',
  name: 'Deluxe Ocean View #201',
  capacity: 2,
  base_rate: 250.00,
  pricing_model: 'per_day',
  features: ['Ocean view', 'King bed', 'Balcony'],
  images: ['deluxe-201.jpg']
})
```

---

## 🎫 **Example 3: Event with Different Ticket Tiers**

### **Using AdvancedEventsService:**

```typescript
import { AdvancedEventsService } from '@/services/advancedEventsService'

const musicFestival = await AdvancedEventsService.createEvent(userId, {
  title: 'Summer Music Festival 2024',
  description: '3-day outdoor music festival',
  category: 'Music',
  event_type: 'in-person',
  
  // Date & Location
  start_date: '2024-07-15T14:00:00Z',
  end_date: '2024-07-17T23:00:00Z',
  venue_name: 'Golden Gate Park',
  city: 'San Francisco',
  country: 'USA',
  
  // Ticketing - Multiple tiers!
  is_free: false,
  ticket_tiers: [
    {
      id: 'general',
      name: 'General Admission',
      description: 'Access to all stages',
      price: 150,
      quantity: 1000,
      available: 1000
    },
    {
      id: 'vip',
      name: 'VIP Pass',
      description: 'VIP lounge, meet & greet, preferred viewing',
      price: 350,
      quantity: 100,
      available: 100
    },
    {
      id: 'backstage',
      name: 'Backstage Access',
      description: 'All VIP benefits + backstage access',
      price: 750,
      quantity: 20,
      available: 20
    }
  ],
  total_capacity: 1120
})
```

### **Via Upload Wizard:**

```
STEP 4: Event Details
┌──────────────────────────────────────┐
│ Ticket Tiers (Multiple)              │
├──────────────────────────────────────┤
│ Tier 1:                              │
│  Name: General Admission             │
│  Price: $150                         │
│  Quantity: 1000                      │
│  [Add Tier]                          │
│                                      │
│ Tier 2:                              │
│  Name: VIP Pass                      │
│  Price: $350                         │
│  Quantity: 100                       │
│  [Add Tier]                          │
│                                      │
│ Tier 3:                              │
│  Name: Backstage                     │
│  Price: $750                         │
│  Quantity: 20                        │
│  [Remove]                            │
└──────────────────────────────────────┘
```

---

## 📊 **Complete Upload Matrix**

| Content Type | Upload Component | Key Features | Multi-Variant |
|--------------|------------------|--------------|---------------|
| **Music** | MusicDetailsStep.tsx | Audio upload, genre, licensing | ✅ Albums (multiple tracks) |
| **Event** | EventDetailsStep.tsx | Date/time, venue, tickets | ✅ Multiple ticket tiers |
| **Hotel/Rental** | RentalDetailsStep.tsx | Daily rate, amenities | ✅ Multiple rooms via variants |
| **Product** | ListingDetailsStep.tsx | Price, condition, shipping | ✅ Sizes/colors via variants |
| **Service** | ServiceDetailsStep.tsx | Pricing, booking | ✅ Multiple service options |
| **Restaurant** | Use ReservationService | Tables, menu, hours | ✅ Multiple tables/services |

---

## 🎨 **Detailed: Upload Music (Step-by-Step)**

### **Step 1: User Interface**
```tsx
// User clicks "Create" button
<CreateButton onClick={openUploadWizard} />

// Wizard opens
<UploadWizard 
  isOpen={true}
  onClose={handleClose}
  onSuccess={(id) => router.push(`/music/${id}`)}
/>
```

### **Step 2: Select Music Type**
```tsx
// TypeSelectionStep shows 8 options
// User clicks "Music & Audio"
onChange({ type: 'music' })
```

### **Step 3: Basic Info**
```tsx
// User fills:
title: "Midnight Drive"
description: "Synthwave track perfect for night drives"
category: "Electronic"
tags: ["synthwave", "retro", "80s"]
```

### **Step 4: Upload Audio Files**
```tsx
// MediaUploadStep
<FileUpload
  accept="audio/*"
  multiple={true} // Can upload album!
  onUpload={(files) => onChange({ audioFiles: files })}
/>

// User uploads:
- Track 1: midnight-drive.mp3
- Track 2: neon-nights.mp3
- Track 3: cyber-dreams.mp3
// (Full album!)

// Also upload cover art:
- album-cover.jpg
```

### **Step 5: Music-Specific Details**
```tsx
// MusicDetailsStep
genre: "Synthwave"
price: 9.99 // For full album
currency: "USD"
licenseType: "non_exclusive"
downloadEnabled: true
streamingEnabled: true
credits: "Produced by John Doe, Mixed by Jane Smith"
```

### **Step 6: Submit**
```tsx
// Wizard processes upload:
1. Upload audio files to Supabase Storage
2. Upload cover art
3. Create music_posts entry with all 3 tracks
4. Auto-publish to feed
5. Show confirmation + share link
```

---

## 🏨 **Detailed: Upload Hotel with Rooms**

### **Method 1: Via Code (Programmatic)**

```typescript
// 1. Create hotel
const hotel = await AdvancedListingService.createListing(userId, {
  listing_type: 'hotel',
  title: 'Grand Plaza Hotel',
  description: '5-star luxury hotel in downtown',
  city: 'New York',
  country: 'USA',
  has_variants: true // Enable room types
})

// 2. Add room variants
const roomTypes = [
  {
    name: 'Standard Room',
    base_price: 150,
    quantity_total: 50,
    attributes: { beds: 1, size: 300, amenities: ['TV', 'WiFi'] }
  },
  {
    name: 'Deluxe Room',
    base_price: 250,
    quantity_total: 30,
    attributes: { beds: 1, size: 400, amenities: ['TV', 'WiFi', 'Mini bar'] }
  },
  {
    name: 'Suite',
    base_price: 500,
    quantity_total: 10,
    attributes: { beds: 2, size: 800, amenities: ['Living room', 'Kitchen', 'Jacuzzi'] }
  }
]

for (const room of roomTypes) {
  await AdvancedListingService.createVariant({
    parent_listing_id: hotel.id,
    variant_type: 'room',
    name: room.name,
    base_price: room.base_price,
    pricing_model: 'per_night',
    quantity_total: room.quantity_total,
    quantity_available: room.quantity_total,
    attributes: room.attributes
  })
}

// ✅ Result: Hotel with 3 room types (90 total rooms)
```

### **Method 2: Via Upload Wizard (UI)**

```
STEP 1: Select "Rental" type
STEP 2: Basic info (hotel name, description)
STEP 3: Upload photos (hotel exterior, lobby, rooms)
STEP 4: Rental Details
┌────────────────────────────────────────┐
│ Has Multiple Room Types? ☑ Yes        │
├────────────────────────────────────────┤
│ Room Type 1:                           │
│  Name: Standard Room                   │
│  Price per night: $150                 │
│  Quantity available: 50                │
│  Beds: 1 King                          │
│  Size: 300 sq ft                       │
│  Amenities: TV, WiFi                   │
│  [Upload Room Photos]                  │
│  [Add Another Room Type]               │
│                                        │
│ Room Type 2:                           │
│  Name: Deluxe Room                     │
│  Price per night: $250                 │
│  ...                                   │
└────────────────────────────────────────┘
STEP 5: Publish
```

---

## 🎫 **Detailed: Event with Multiple Tickets**

### **Via Upload Wizard:**

```
STEP 1: Select "Event" type
STEP 2: Basic info
  title: "Tech Conference 2024"
  description: "3-day tech conference"
  category: "Technology"

STEP 3: Upload event images
  - Venue photo
  - Speaker photos
  - Past event photos

STEP 4: Event Details
  (components/upload-steps/EventDetailsStep.tsx)
  
┌──────────────────────────────────────────┐
│ Date & Time:                             │
│  Start: July 15, 2024 at 9:00 AM        │
│  End: July 17, 2024 at 6:00 PM          │
│                                          │
│ Location:                                │
│  Venue: Convention Center                │
│  Address: 123 Main St, San Francisco     │
│                                          │
│ Ticket Pricing:                          │
│  Single Ticket: $299                     │
│  Currency: USD                           │
│  Capacity: 1000                          │
└──────────────────────────────────────────┘
```

### **For Multi-Tier Tickets (Use Advanced Service):**

```typescript
// After basic event is created, add ticket tiers
const event = await AdvancedEventsService.createEvent(userId, {
  title: "Tech Conference 2024",
  // ... other details
  ticket_tiers: [
    {
      id: 'early_bird',
      name: 'Early Bird',
      price: 199,
      quantity: 100,
      available: 100
    },
    {
      id: 'general',
      name: 'General Admission',
      price: 299,
      quantity: 800,
      available: 800
    },
    {
      id: 'vip',
      name: 'VIP Access',
      price: 599,
      quantity: 100,
      available: 100
    }
  ]
})
```

---

## 🍽️ **Example 4: Restaurant with Services**

```typescript
// Create restaurant
const restaurant = await ReservationService.quickSetupBusiness(userId, {
  business_type: 'restaurant',
  business_name: 'Bella Italia',
  city: 'New York',
  country: 'USA',
  address: '456 Fifth Ave'
})

// Auto-creates 5 tables
// Or add specific tables:
await ReservationService.createResource({
  business_id: restaurant.id,
  resource_type: 'table',
  name: 'Window Table 1',
  capacity: 4,
  features: ['Window view', 'Romantic']
})

// Add services (if offering private dining, etc.)
await ReservationService.createService({
  business_id: restaurant.id,
  name: 'Private Dining Room',
  duration_minutes: 180,
  price: 500.00,
  requires_staff: true
})
```

---

## 💡 **Where Each Upload Method Exists**

### **Upload Wizard (UI):**
```
components/
├── UploadWizard.tsx ← Main wizard
└── upload-steps/
    ├── TypeSelectionStep.tsx ← Choose type
    ├── BasicInfoStep.tsx ← Title, description
    ├── MediaUploadStep.tsx ← Files
    ├── MusicDetailsStep.tsx ← Music specifics
    ├── EventDetailsStep.tsx ← Event specifics
    ├── RentalDetailsStep.tsx ← Rental specifics
    ├── ListingDetailsStep.tsx ← Product specifics
    ├── ServiceDetailsStep.tsx ← Service specifics
    ├── ExperienceDetailsStep.tsx ← Experience specifics
    ├── GroupDetailsStep.tsx ← Group specifics
    └── ReviewStep.tsx ← Final review
```

### **Direct Services (API):**
```
services/
├── contentService.ts ← Generic content creation
├── richMediaService.ts ← Music, video, documents
├── advancedEventsService.ts ← Events with tickets
├── advancedListingService.ts ← Products/hotels with variants
├── reservationService.ts ← Restaurants, salons, bookings
├── auctionService.ts ← Auctions
├── fundraiserService.ts ← Crowdfunding
└── enterpriseAuctionService.ts ← Professional auctions
```

---

## 🎨 **Complete Upload Examples**

### **Upload Music Album:**
```tsx
// Via UI: UploadWizard
1. Click [Create] button
2. Select "Music & Audio"
3. Fill: Title, Artist name, Description
4. Upload: 10 audio files (.mp3)
5. Upload: 1 cover art image
6. Set: Genre, Price ($9.99 for album)
7. Enable: Download + Streaming
8. Publish!

// Via Code:
await RichMediaService.createMusicPost(userId, {
  title: "Summer Vibes - Complete Album",
  artist: "The Sunset Band",
  audio_url: "album-track-1.mp3",
  audio_urls: ["track1.mp3", "track2.mp3", ..., "track10.mp3"],
  cover_image_url: "album-cover.jpg",
  genre: "Indie Rock",
  price: 9.99
})
```

### **Upload Hotel with 3 Room Types:**
```tsx
// Via Code (Best method):
const hotel = await AdvancedListingService.createListing(userId, {
  listing_type: 'hotel',
  title: "Grand Hotel",
  has_variants: true
})

// Add room types
await AdvancedListingService.createVariant({...}) // Standard - 50 rooms
await AdvancedListingService.createVariant({...}) // Deluxe - 30 rooms
await AdvancedListingService.createVariant({...}) // Suite - 10 rooms

// Total: 90 bookable rooms across 3 types
```

### **Upload Event with 4 Ticket Tiers:**
```tsx
// Via Code:
await AdvancedEventsService.createEvent(userId, {
  title: "Concert",
  ticket_tiers: [
    { name: 'Early Bird', price: 50, quantity: 100 },
    { name: 'General', price: 75, quantity: 500 },
    { name: 'VIP', price: 150, quantity: 50 },
    { name: 'Meet & Greet', price: 300, quantity: 20 }
  ]
})
```

---

## 📱 **UI Components Needed**

### **Currently Exist:**
✅ UploadWizard (full multi-step flow)
✅ TypeSelectionStep (choose content type)
✅ MusicDetailsStep (music-specific)
✅ EventDetailsStep (event-specific)
✅ RentalDetailsStep (rental-specific)
✅ MediaUploadStep (file uploads)

### **Would Be Helpful to Add:**

🔄 **VariantManagerStep** - For managing multiple variants
```tsx
// New component for hotel rooms, product sizes, etc.
<VariantManagerStep>
  [Add Variant]
  Variant 1: Deluxe Room - $250/night - 10 available
  Variant 2: Suite - $500/night - 2 available
  [Add Another Variant]
</VariantManagerStep>
```

🔄 **TicketTierManager** - For multi-tier events
```tsx
<TicketTierManager>
  [Add Tier]
  Tier 1: General - $50 - 500 tickets
  Tier 2: VIP - $150 - 50 tickets
  [Add Another Tier]
</TicketTierManager>
```

---

## 🚀 **Access Points in App**

### **Where Users Can Upload:**

1. **Main Header**
```tsx
<AppHeader>
  <CreateButton /> ← Opens UploadWizard
</AppHeader>
```

2. **Bottom Navigation**
```tsx
<BottomNav>
  <AddButton /> ← Opens UploadWizard
</BottomNav>
```

3. **Profile Page**
```tsx
<ProfilePage>
  <AddContentButton /> ← Opens UploadWizard
</ProfilePage>
```

4. **Empty States**
```tsx
<EmptyState>
  <CreateFirstContentButton />
</EmptyState>
```

---

## ✅ **Current State Summary**

### **What Exists:**
✅ **Upload Wizard** - Complete 5-step flow
✅ **8 Content Types** - All with dedicated detail steps
✅ **File Upload** - Images, audio, video, documents
✅ **Multi-file Support** - Albums, galleries
✅ **Auto-save to Database** - Automatic via ContentService

### **How Variants Work:**
✅ **Hotel Rooms** - Use `advancedListingService.createVariant()`
✅ **Ticket Tiers** - Use `ticket_tiers` JSON array
✅ **Product Sizes** - Use `listing_variants` table
✅ **Service Options** - Use `reservation_services` table

### **Missing UI (Easy to Add):**
🔄 Variant manager in UploadWizard (for rooms/sizes)
🔄 Ticket tier builder in EventDetailsStep
🔄 Auction/Fundraiser in TypeSelection (new types)

---

## 💻 **Quick Implementation**

### **Add to Upload Wizard:**

```typescript
// components/upload-steps/TypeSelectionStep.tsx
// Add these to contentTypes array:

{
  type: 'auction' as UploadType,
  title: 'Auction',
  description: 'Create an auction for bidding',
  icon: Gavel,
  color: 'bg-amber-500',
  features: ['Timed bidding', 'Reserve price', 'Auto-extend']
},
{
  type: 'fundraiser' as UploadType,
  title: 'Fundraiser',
  description: 'Start a crowdfunding campaign',
  icon: Heart,
  color: 'bg-red-500',
  features: ['Goal setting', 'Reward tiers', 'Updates for backers']
},
{
  type: 'reservation_business' as UploadType,
  title: 'Restaurant/Salon/Hotel',
  description: 'Set up a reservation business',
  icon: Store,
  color: 'bg-cyan-500',
  features: ['Auto-setup', 'Booking calendar', 'Staff management']
}
```

---

## 🎯 **Summary**

### **Where Users Upload:**
✅ **UI:** UploadWizard component (accessible via Create button)
✅ **API:** Service functions (for bulk/programmatic uploads)

### **How Multi-Variant Works:**

**Music/Albums:**
```typescript
audioFiles: File[] // Multiple tracks
→ Uploads all to music_posts with audio_urls array
```

**Hotels/Rooms:**
```typescript
has_variants: true
→ Create listing
→ Add variants for each room type
→ Each variant has quantity (10 deluxe rooms, 5 suites)
```

**Events/Tickets:**
```typescript
ticket_tiers: [
  { name: 'GA', price: 50, quantity: 500 },
  { name: 'VIP', price: 150, quantity: 50 }
]
→ Stored in advanced_events table as JSONB
```

**The upload system is already built and works!** Just needs UI components for the new auction/fundraiser/reservation types. 🚀

Would you like me to create those missing upload steps for the new content types?
