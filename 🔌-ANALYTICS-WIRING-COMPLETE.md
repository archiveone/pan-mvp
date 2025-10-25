# 🔌 ANALYTICS WIRING - COMPLETE GUIDE

## ✅ ANALYTICS NOW CONNECTED!

I've wired up the analytics system to automatically track user interactions!

---

## 📊 WHAT'S NOW TRACKED AUTOMATICALLY

### **1. View Tracking** 👁️
```
When: User clicks on any content from the grid
Where: Homepage, Collections, Search results
What's tracked:
✅ Content ID
✅ User ID
✅ Session ID
✅ Device type (mobile/desktop/tablet)
✅ Timestamp

Triggered by: ListingGrid.tsx → handleListingClick()
```

### **2. Save Tracking** 🔖
```
When: User saves item to collection
Where: SaveToFolderButton (everywhere)
What's tracked:
✅ Content ID
✅ User ID
✅ Session ID
✅ Saved = true
✅ Device type
✅ Timestamp

Triggered by: SaveToFolderButton.tsx → toggleFolder()
```

---

## 🔌 FILES UPDATED WITH TRACKING

### **1. `components/ListingGrid.tsx`** ✅
```typescript
Added:
• Import AdvancedAnalyticsService
• handleListingClick() function
• onClick tracking on Link

Result:
→ Every grid click tracked as a view!
```

### **2. `components/SaveToFolderButton.tsx`** ✅
```typescript
Added:
• Import AdvancedAnalyticsService
• Track save in toggleFolder()

Result:
→ Every save tracked!
```

### **3. `hooks/useAnalytics.ts`** ✅ (NEW FILE)
```typescript
Created hooks for:
• usePageView() - Auto-track page views
• useStreamTracking() - Track media playback
• useEngagementTracking() - Track likes, shares

Can be used anywhere!
```

---

## 🎯 HOW TO ADD MORE TRACKING

### **Track Likes:**
```typescript
import { useEngagementTracking } from '@/hooks/useAnalytics';

const { trackLike } = useEngagementTracking();

const handleLike = async () => {
  await trackLike(postId);
  // Your like logic
};
```

### **Track Shares:**
```typescript
const { trackShare } = useEngagementTracking();

const handleShare = async () => {
  await trackShare(postId);
  // Your share logic
};
```

### **Track Page Views:**
```typescript
import { usePageView } from '@/hooks/useAnalytics';

// In any detail page:
usePageView(contentId, 'music'); // Auto-tracks on mount
```

### **Track Streaming:**
```typescript
import { useStreamTracking } from '@/hooks/useAnalytics';

const { startStream, updateStream, endStream } = useStreamTracking(
  contentId,
  totalDuration,
  'audio'
);

// On play:
startStream();

// On progress:
updateStream(currentTime);

// On end:
endStream(currentTime);
```

---

## 📊 WHAT DATA GETS COLLECTED

### **Every View Event:**
```json
{
  "content_id": "uuid",
  "user_id": "uuid or null",
  "session_id": "unique-session",
  "viewed_at": "timestamp",
  "device_type": "mobile/desktop/tablet",
  "referrer": "where they came from",
  "country": "location data",
  "view_duration_seconds": 0,
  "scroll_depth_percentage": 0,
  "saved": false,
  "liked": false,
  "shared": false
}
```

### **Every Save Event:**
```json
{
  "content_id": "uuid",
  "user_id": "uuid",
  "session_id": "unique-session",
  "viewed_at": "timestamp",
  "saved": true,
  "device_type": "mobile/desktop/tablet"
}
```

---

## 🎯 WHERE TO ADD MORE TRACKING

### **IMMEDIATE (High Value):**

#### **1. Content Detail Pages**
```typescript
// app/listing/[id]/page.tsx
import { usePageView } from '@/hooks/useAnalytics';

export default function ListingDetail({ params }) {
  usePageView(params.id, 'listing'); // ← Add this
  // Rest of page...
}
```

#### **2. Like Buttons**
```typescript
// Any like button component
import { useEngagementTracking } from '@/hooks/useAnalytics';

const { trackLike } = useEngagementTracking();

const handleLike = async () => {
  await trackLike(contentId); // ← Add this
  // Existing like logic
};
```

#### **3. Music/Video Players**
```typescript
// Music player component
import { useStreamTracking } from '@/hooks/useAnalytics';

const { startStream, updateStream, endStream } = useStreamTracking(
  songId,
  duration,
  'audio'
);

audio.onplay = () => startStream();
audio.ontimeupdate = () => updateStream(audio.currentTime);
audio.onended = () => endStream(audio.currentTime);
```

#### **4. Purchase/Booking Flows**
```typescript
// Payment completion
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService';

const onPaymentSuccess = async (transactionId, amount) => {
  await AdvancedAnalyticsService.trackSale({
    transactionId,
    contentId,
    sellerId,
    buyerId: user.id,
    grossAmount: amount,
    netAmount: amount * 0.9, // After 10% fee
    platformFee: amount * 0.1,
    currency: 'USD',
  });
};
```

---

## 📈 DASHBOARD DATA CONNECTION

### **Current Status:**
```
Dashboard Pages:
• /dashboard - Uses mock data
• /dashboard/advanced - Uses mock data
• /dashboard/modular - Uses mock data

Need to connect to real analytics!
```

### **How to Connect:**
```typescript
// In dashboard page:
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService';

const loadAnalytics = async () => {
  const result = await AdvancedAnalyticsService.getDashboardAnalytics(
    user.id,
    30 // days
  );
  
  if (result.success) {
    setAnalytics(result.data); // Real data!
  }
};
```

---

## ✅ WHAT'S WORKING NOW

### **Automatically Tracked:**
✅ **Grid Clicks** - Every click on homepage tracked as view  
✅ **Saves** - Every save to collection tracked  
✅ **Session IDs** - Unique session per user  
✅ **Device Type** - Mobile/desktop/tablet  

### **Ready to Track:**
⏳ **Likes** - Need to add to like button components  
⏳ **Shares** - Need to add to share buttons  
⏳ **Page Views** - Need to add to detail pages  
⏳ **Streaming** - Need to add to music/video players  
⏳ **Sales** - Need to add to checkout flow  

---

## 🎯 NEXT STEPS TO COMPLETE CONNECTION

### **1. Add to Detail Pages** (5 min)
```
Files to update:
• app/listing/[id]/page.tsx
• app/music/[id]/page.tsx
• app/video/[id]/page.tsx
• etc.

Add: usePageView(id, type);
```

### **2. Add to Player Components** (10 min)
```
Files to update:
• components/MusicPlayerBox.tsx
• components/VideoPlaylistBox.tsx

Add: useStreamTracking()
```

### **3. Connect Dashboard Data** (15 min)
```
Files to update:
• app/dashboard/page.tsx
• app/dashboard/modular/page.tsx

Replace mock data with:
AdvancedAnalyticsService.getDashboardAnalytics()
```

### **4. Add to Engagement Actions** (10 min)
```
Add tracking to:
• Like buttons
• Share buttons
• Comment submissions
```

---

## 🎊 CURRENT STATE

### **✅ Working:**
- Analytics tables created
- Tracking service ready
- Grid clicks tracked
- Saves tracked
- Hooks created

### **⏳ Pending:**
- Detail page tracking
- Player tracking
- Dashboard data connection
- Like/share tracking

### **Progress:** ~40% Connected

---

## 🚀 QUICK WINS

To see analytics working RIGHT NOW:

1. **Click some items** on homepage
   → Views tracked!

2. **Save some items** to collections
   → Saves tracked!

3. **Check database:**
   ```
   Supabase Dashboard → Database → Tables
   → view_analytics table
   → Should have rows!
   ```

---

## 📊 FULL CONNECTION GUIDE

I'll create detailed guides for:
1. ✅ Grid tracking (DONE!)
2. ✅ Save tracking (DONE!)
3. ⏳ Detail page tracking
4. ⏳ Player tracking
5. ⏳ Dashboard data
6. ⏳ Like/share tracking

Want me to continue wiring up the rest?

---

## 🎉 SUMMARY

**Analytics ARE now connected to:**
- ✅ Homepage grid clicks
- ✅ Save to collection button

**Still need to connect:**
- ⏳ Detail page views
- ⏳ Music/video streaming
- ⏳ Dashboard data display
- ⏳ Like/share buttons

**Want me to complete the wiring?** Let me know! 🚀

