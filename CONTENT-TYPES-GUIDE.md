# 🎯 PAN Content Types - Complete Guide

## Overview
Everything in PAN is a **post** with a `post_type`. All content is discoverable, purchasable, and collectable.

---

## 🎵 Music

### Singles
```json
{
  "post_type": "music_single",
  "title": "Summer Nights",
  "price_amount": 0.99,
  "is_for_sale": true,
  "is_digital": true,
  "digital_file_url": "https://...",
  "media_url": "https://cover-art.jpg",
  "metadata": {
    "artist": "Artist Name",
    "album": "Summer Album",
    "duration": "3:45",
    "genre": "Pop",
    "explicit": false,
    "release_date": "2025-10-22",
    "track_number": 1,
    "isrc": "US-XXX-XX-XXXXX",
    "audio_preview_url": "https://preview-30sec.mp3"
  }
}
```

### Albums
```json
{
  "post_type": "music_album",
  "title": "Summer Album",
  "price_amount": 9.99,
  "is_for_sale": true,
  "metadata": {
    "artist": "Artist Name",
    "duration": "45:30",
    "genre": "Pop",
    "release_date": "2025-10-22",
    "track_count": 12,
    "tracks": [
      {"number": 1, "title": "Summer Nights", "duration": "3:45"},
      {"number": 2, "title": "Ocean Waves", "duration": "4:20"}
    ]
  }
}
```

**Purchase Flow:**
1. User clicks "Buy $0.99"
2. Stripe checkout
3. `purchase_post()` function:
   - Creates transaction
   - Auto-adds to "My Library" collection
   - Grants access to `digital_file_url`

---

## 🎬 Videos

### Movies / Videos
```json
{
  "post_type": "video",
  "title": "The Journey",
  "price_amount": 4.99,
  "is_for_sale": true,
  "is_digital": true,
  "metadata": {
    "duration": "1:45:30",
    "resolution": "4K",
    "genre": "Documentary",
    "rating": "PG-13",
    "release_year": 2025,
    "director": "Director Name",
    "cast": ["Actor 1", "Actor 2"],
    "trailer_url": "https://trailer.mp4",
    "subtitles": ["en", "es", "fr"]
  }
}
```

**Purchase Flow:**
- Buy → Added to "My Library"
- Stream anytime
- Download if `download_limit` allows

---

## 📚 Courses

```json
{
  "post_type": "course",
  "title": "Web Development Masterclass",
  "price_amount": 49.99,
  "is_for_sale": true,
  "is_digital": true,
  "metadata": {
    "duration_hours": 25,
    "level": "Beginner",
    "instructor": "Instructor Name",
    "lessons_count": 150,
    "certificate": true,
    "language": "English",
    "what_youll_learn": [
      "HTML/CSS",
      "JavaScript",
      "React"
    ],
    "preview_video_url": "https://preview.mp4"
  }
}
```

---

## 🎫 Event Tickets

```json
{
  "post_type": "event",
  "title": "Summer Music Festival",
  "price_amount": 89.00,
  "is_for_sale": true,
  "inventory_type": "limited",
  "stock_quantity": 500,
  "metadata": {
    "event_date": "2025-08-15T19:00:00Z",
    "event_end_date": "2025-08-15T23:00:00Z",
    "venue": "Central Park",
    "address": "New York, NY",
    "capacity": 5000,
    "tickets_remaining": 500,
    "age_restriction": "18+",
    "lineup": ["Artist 1", "Artist 2", "Artist 3"],
    "door_time": "18:00",
    "parking_info": "Available on-site"
  }
}
```

**Purchase Flow:**
- Buy → Added to "My Tickets" collection
- Generates QR code in `transaction_data`
- Show QR code at venue

---

## 🏠 Bookings / Stays

```json
{
  "post_type": "booking",
  "title": "Cozy Downtown Loft",
  "price_amount": 150.00, // per night
  "is_for_sale": true,
  "metadata": {
    "availability_start": "2025-11-01",
    "availability_end": "2025-12-31",
    "check_in_time": "15:00",
    "check_out_time": "11:00",
    "max_guests": 4,
    "bedrooms": 2,
    "bathrooms": 1.5,
    "property_type": "Apartment",
    "amenities": ["WiFi", "Kitchen", "AC", "TV", "Parking"],
    "house_rules": ["No smoking", "No parties"],
    "cancellation_policy": "Free cancellation up to 24 hours before"
  }
}
```

**Purchase Flow:**
- Select dates
- Buy → Added to "My Bookings"
- Confirmation code generated
- Host and guest can message

---

## 📦 Physical Products

```json
{
  "post_type": "product",
  "title": "Premium Sneakers",
  "price_amount": 129.99,
  "is_for_sale": true,
  "requires_shipping": true,
  "shipping_cost": 9.99,
  "inventory_type": "limited",
  "stock_quantity": 25,
  "metadata": {
    "sku": "SNKR-12345",
    "brand": "Brand Name",
    "color": "Blue/White",
    "size": "US 10",
    "weight": "1.2kg",
    "dimensions": "30x20x12cm",
    "materials": ["Leather", "Rubber"],
    "shipping_from": "New York, NY",
    "estimated_shipping_days": 5
  }
}
```

**Purchase Flow:**
- Add to cart
- Enter shipping address
- Buy → Added to "My Purchases"
- Track shipment with `tracking_number` in transaction_data

---

## 💼 Services

```json
{
  "post_type": "service",
  "title": "1-Hour Design Consultation",
  "price_amount": 75.00,
  "is_for_sale": true,
  "metadata": {
    "duration_minutes": 60,
    "service_type": "Consultation",
    "availability": ["Mon-Fri 9am-5pm"],
    "location_type": "remote",
    "platforms": ["Zoom", "Google Meet"],
    "what_includes": [
      "Portfolio review",
      "Career advice",
      "Q&A session"
    ],
    "requirements": ["Prepare questions", "Share portfolio"]
  }
}
```

---

## 🎯 The Beauty: It's All Unified!

### Discovery (Homepage Feed)
```javascript
// Everything shows in one feed
const feed = await getUnifiedFeed();
// Returns: [music, videos, events, products, services, bookings...]
```

### Purchase Flow (Same for Everything)
```javascript
// Buy anything
const transaction = await purchasePost({
  postId: '...',
  amount: 9.99,
  stripePaymentIntentId: 'pi_xxx'
});
// Automatically:
// 1. Creates transaction
// 2. Adds to appropriate collection (tickets/bookings/purchases/library)
// 3. Grants access (QR codes, download links, confirmation codes)
```

### Collections (Universal Organization)
```
🎫 My Tickets      → Events you bought
🏠 My Bookings     → Stays/reservations you booked
📦 My Purchases    → Physical products ordered
📚 My Library      → Music, videos, courses you own
❤️ Favorites       → Anything you saved (free)
```

---

## 🚀 What Makes This Powerful

✅ **One Feed** - Everything discoverable together  
✅ **One Purchase Flow** - Same UX for all types  
✅ **One Collection System** - Unified organization  
✅ **Flexible Metadata** - Each type has rich data  
✅ **Cross-Type Features** - Comment, like, share anything  
✅ **Universal Search** - Find music, products, events in one search  

---

## Example: User Journey

1. **Browse Feed** → See concert post, sneakers, album, Airbnb all mixed
2. **Buy Concert Ticket** → $89, goes to "My Tickets", QR code ready
3. **Buy Album** → $9.99, goes to "My Library", stream immediately
4. **Save Sneakers** → Add to "Wishlist" collection (custom)
5. **Book Airbnb** → $150/night, goes to "My Bookings", confirmation code
6. **All organized** in My Collections page

Everything is a post. Everything is unified. 🎯

