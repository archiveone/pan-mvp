# 🎯 Create E-Commerce Tables One at a Time (Deadlock-Proof!)

## Problem:
Your dev server is using the database, causing deadlocks when running big SQL files.

## Solution:
Run these **one at a time** - copy each block separately and run individually.

---

## 📋 Copy & Run Each Block Separately:

### **1. Marketplace Listings Table**
```sql
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  quantity_available INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Click "Run"**, wait for success, then continue...

---

### **2. Marketplace Orders Table**
```sql
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  order_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Click "Run"**, wait for success, then continue...

---

### **3. Event Tickets Table**
```sql
CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES advanced_events(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity_available INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Click "Run"**, wait for success, then continue...

---

### **4. Ticket Purchases Table**
```sql
CREATE TABLE IF NOT EXISTS ticket_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendee_name VARCHAR(200) NOT NULL,
  qr_code TEXT UNIQUE,
  checked_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Click "Run"**, wait for success, then continue...

---

### **5. User Bookings Table**
```sql
CREATE TABLE IF NOT EXISTS user_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  confirmation_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Click "Run"**, wait for success, then continue...

---

### **6. User Library Table**
```sql
CREATE TABLE IF NOT EXISTS user_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  can_download BOOLEAN DEFAULT true,
  can_stream BOOLEAN DEFAULT true,
  UNIQUE(user_id, content_id)
);
```
**Click "Run"**, wait for success, then continue...

---

### **7. Payment Intents Table**
```sql
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_payment_intent_id VARCHAR(200) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Click "Run"**, done!

---

## ✅ That's It!

**No deadlocks!** Each table creates independently.

After all 7 are created, your marketplace is ready! 🎉

