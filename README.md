# 🌟 PAN - Social Platform & Marketplace

A beautiful, feature-rich social platform with a unique personal hub system, messaging, and content organization.

---

## ✨ Features

### 🎯 Personal Hub
- Draggable, resizable collection boxes
- Organize posts, saved items, and conversations
- Customizable colors and backgrounds
- Public/private visibility settings
- Theme toggle (light/dark mode)

### 👤 Profile System
- Customizable profile box (color or image)
- Avatar, name, username, bio
- Follow/follower system
- Public collections display
- Stats and activity tracking

### 💬 Messaging
- Direct messages
- Group chats  
- Message requests (privacy for non-followers)
- Custom inbox organization
- Real-time updates

### 🔔 Notifications
- Real-time notification system
- Follow, like, comment, mention alerts
- Red dot indicator
- Mark as read/delete

### 📱 Content
- Create posts and listings
- Upload images and videos
- Like and comment system
- Search and filters
- Save to collections

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.local.example to .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Setup

Run these migrations in your Supabase SQL Editor:

1. `supabase/migrations/notifications_final.sql`
2. `supabase/migrations/message_requests_only.sql`

---

## 🎨 Key Pages

- `/` - Homepage feed
- `/hub` - Personal hub dashboard
- `/profile/[id]` - User profiles
- `/inbox` - Messaging
- `/listing/[id]` - Content details

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **UI:** React, Lucide Icons
- **Real-time:** Supabase Realtime
- **Auth:** Supabase Auth
- **Grid:** React Grid Layout

---

## 📦 Project Structure

```
pan/
├── app/                  Next.js app routes
├── components/           Reusable UI components
├── services/             Business logic & API calls
├── contexts/             React contexts (auth, theme)
├── hooks/                Custom React hooks
├── lib/                  Utilities
├── supabase/migrations/  Database migrations
├── styles/               Global styles
└── types/                TypeScript types
```

---

## 🎯 What Makes Pan Special

1. **Hub System** - Unique personal dashboard with draggable boxes
2. **Flexibility** - Social network + marketplace in one
3. **Privacy** - Message requests, public/private collections
4. **Customization** - Personalize everything
5. **Real-time** - Live updates for messages and notifications

---

## 📱 Mobile Responsive

Pan works beautifully on:
- 📱 Mobile phones
- 📲 Tablets
- 💻 Desktops
- 🖥️ Large screens

---

## 🔒 Security

- Row Level Security (RLS) enabled
- Authenticated routes protected
- Encrypted messaging
- Secure file uploads
- Privacy controls

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel
```

### Environment Variables Required:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📄 License

MIT

---

## 🎉 You're Ready!

Pan is a fully functional social platform and marketplace. Customize it, extend it, and make it your own!

**Start building amazing communities! 🚀**
