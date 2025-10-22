// DARK MODE FIX PATTERNS
// Copy these patterns to fix components with missing dark mode

// ====================================
// COMMON FIXES
// ====================================

// 1. PAGE CONTAINERS
// Before:
<div className="min-h-screen bg-white">

// After:
<div className="min-h-screen bg-white dark:bg-gray-900">


// 2. CARD/BOX CONTAINERS
// Before:
<div className="bg-white rounded-lg p-4">

// After:
<div className="bg-white dark:bg-gray-800 rounded-lg p-4">


// 3. HEADINGS
// Before:
<h1 className="text-2xl font-bold text-gray-900">

// After:
<h1 className="text-2xl font-bold text-gray-900 dark:text-white">


// 4. BODY TEXT
// Before:
<p className="text-gray-700">

// After:
<p className="text-gray-700 dark:text-gray-300">


// 5. SECONDARY TEXT
// Before:
<span className="text-gray-600">

// After:
<span className="text-gray-600 dark:text-gray-400">


// 6. BORDERS
// Before:
<div className="border border-gray-200">

// After:
<div className="border border-gray-200 dark:border-gray-700">


// 7. INPUT FIELDS
// Before:
<input className="bg-white border-gray-300 text-gray-900" />

// After:
<input className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />


// 8. BUTTONS (Secondary)
// Before:
<button className="bg-gray-100 text-gray-700">

// After:
<button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">


// 9. HOVER STATES
// Before:
<button className="hover:bg-gray-100">

// After:
<button className="hover:bg-gray-100 dark:hover:bg-gray-800">


// 10. MODALS/POPUPS
// Before:
<div className="bg-white rounded-lg shadow-xl">
  <div className="border-b border-gray-200 p-4">
    <h2 className="text-xl font-bold text-black">Title</h2>
  </div>
  <div className="p-4">
    <p className="text-gray-700">Content</p>
  </div>
</div>

// After:
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
  <div className="border-b border-gray-200 dark:border-gray-700 p-4">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Title</h2>
  </div>
  <div className="p-4">
    <p className="text-gray-700 dark:text-gray-300">Content</p>
  </div>
</div>


// ====================================
// COMPONENTS ALREADY FIXED
// ====================================

// ✅ ListingCard - All dark mode classes added
// ✅ ListingGrid - Skeleton loaders have dark mode
// ✅ AuthModal - Full dark mode support
// ✅ PaymentModal - Dark mode ready
// ✅ CollectionEditor - All backgrounds adapt
// ✅ All folder modals - Responsive + dark mode
// ✅ ReportButton - 10 dark mode classes

// ====================================
// SPECIAL CASES
// ====================================

// Colored Buttons (stay same in both modes)
<button className="bg-blue-500 text-white hover:bg-blue-600">
  // No dark: prefix needed - color works in both modes
</button>

// Text on Colored Backgrounds
<div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
  // Text stays white - works on colored background
</div>

// Images/Icons
<img className="..." />
// No dark mode needed for images

// Transparent Overlays
<div className="bg-black/50">
  // Works in both modes - absolute colors OK
</div>


// ====================================
// TESTING CHECKLIST
// ====================================

/*
1. Toggle dark mode (header icon)
2. Check each page:
   - Homepage feed ✓
   - Profile page
   - Hub dashboard
   - Collection pages
   - Messages
   - Notifications
   
3. Open all modals:
   - Auth modal ✓
   - Payment modal ✓
   - Collection editor ✓
   - Report modal ✓
   - Story creator ✓
   
4. Test forms:
   - Sign in/up
   - Create post
   - Edit profile
   - Create collection
   
5. Check all text is readable
6. Check all inputs are visible
7. Check all borders are visible
*/

