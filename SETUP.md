# 🚀 Pan Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Migrations

Run in Supabase Dashboard → SQL Editor:
1. `supabase/migrations/notifications_final.sql`
2. `supabase/migrations/message_requests_only.sql`

### 4. Start Development Server
```bash
npm run dev
```

Open: `http://localhost:3000`

---

## 🎯 Core Features

- Personal Hub with draggable boxes
- Profile customization
- Posts and listings
- Messaging with requests
- Real-time notifications
- Follow/follower system
- Light/dark theme

---

## 📦 Supabase Tables Required

- profiles
- posts
- followers
- conversations
- conversation_participants
- messages
- notifications
- hub_boxes
- hub_box_items

---

## 🔥 You're Ready!

Pan is fully functional. Just run migrations and start building your community!

