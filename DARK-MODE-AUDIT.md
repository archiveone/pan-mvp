# 🌓 Dark Mode Audit & Fix Guide

## ✅ Dark Mode Setup (Working)

Your app uses Tailwind's class-based dark mode:
- `tailwind.config.js`: `darkMode: 'class'`
- `ThemeContext.tsx`: Toggles `dark` class on `<html>`
- Saved to localStorage as `pan-theme`

---

## 🎯 Common Dark Mode Issues & Fixes

### **Issue 1: Text Not Changing Color**

**❌ Problem:**
```tsx
<p className="text-gray-900">Text</p>
// In dark mode, gray-900 is still dark = invisible on dark background
```

**✅ Fix:**
```tsx
<p className="text-gray-900 dark:text-white">Text</p>
// OR
<p className="text-gray-900 dark:text-gray-100">Text</p>
```

---

### **Issue 2: Backgrounds Not Adapting**

**❌ Problem:**
```tsx
<div className="bg-white">Content</div>
// White background in dark mode = blinding
```

**✅ Fix:**
```tsx
<div className="bg-white dark:bg-gray-800">Content</div>
// OR for lighter dark mode:
<div className="bg-white dark:bg-gray-900">Content</div>
```

---

### **Issue 3: Borders Invisible in Dark Mode**

**❌ Problem:**
```tsx
<div className="border border-gray-200">Box</div>
// Gray-200 is too light in dark mode
```

**✅ Fix:**
```tsx
<div className="border border-gray-200 dark:border-gray-700">Box</div>
```

---

### **Issue 4: Input Fields**

**❌ Problem:**
```tsx
<input className="bg-white border-gray-300" />
// White inputs in dark mode
```

**✅ Fix:**
```tsx
<input className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" />
```

---

### **Issue 5: Modals/Popups**

**❌ Problem:**
```tsx
<div className="bg-white">
  <h2 className="text-black">Title</h2>
  <p className="text-gray-700">Text</p>
</div>
```

**✅ Fix:**
```tsx
<div className="bg-white dark:bg-gray-800">
  <h2 className="text-gray-900 dark:text-white">Title</h2>
  <p className="text-gray-700 dark:text-gray-300">Text</p>
</div>
```

---

## 📋 Standard Dark Mode Pattern

### **Text Colors:**
```tsx
// Headings
className="text-gray-900 dark:text-white"

// Body text
className="text-gray-700 dark:text-gray-300"

// Secondary text
className="text-gray-600 dark:text-gray-400"

// Disabled/muted text
className="text-gray-400 dark:text-gray-500"
```

### **Backgrounds:**
```tsx
// Page background
className="bg-white dark:bg-gray-900"

// Card/container background
className="bg-white dark:bg-gray-800"

// Subtle background
className="bg-gray-50 dark:bg-gray-900"

// Input background
className="bg-white dark:bg-gray-700"
```

### **Borders:**
```tsx
// Standard border
className="border border-gray-200 dark:border-gray-700"

// Divider
className="border-gray-300 dark:border-gray-600"
```

### **Buttons:**
```tsx
// Primary button (usually colored, stays same)
className="bg-blue-500 text-white hover:bg-blue-600"

// Secondary button
className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"

// Ghost button
className="hover:bg-gray-100 dark:hover:bg-gray-800"
```

---

## 🔍 Components That Need Checking

Based on the audit, these have the most dark mode usage:
- ✅ `ListingGrid.tsx` - 5 instances
- ✅ `ListingCard.tsx` - 6 instances (just fixed!)
- ✅ `ReportButton.tsx` - 10 instances
- ✅ All modals - Fixed with responsive updates

**Check these for missing dark mode:**
- Button components
- Form inputs
- Error messages
- Success notifications
- Loading states

---

## 🛠️ Quick Test

### Toggle dark mode and check:
1. **Homepage feed** - All text readable?
2. **Listing cards** - Info box adapts?
3. **Open a modal** - All text visible?
4. **Form inputs** - Can you see what you're typing?
5. **Buttons** - Clear contrast?
6. **Notifications** - Readable?

---

## 💡 Pro Tips

### **Use Tailwind Dark Mode Utilities:**
```tsx
// Instead of manual dark mode checks
const textColor = theme === 'dark' ? 'white' : 'black'

// Use Tailwind classes
className="text-gray-900 dark:text-white"
```

### **Test Both Modes:**
```bash
# Light mode
Click sun/moon icon in header

# Dark mode  
Click sun/moon icon again

# System preference
Browser DevTools > Rendering > Emulate CSS media feature prefers-color-scheme
```

### **Consistent Color Palette:**
```
Light Mode Palette:
- Background: white / gray-50
- Cards: white / gray-100
- Text: gray-900 / gray-700 / gray-600
- Borders: gray-200 / gray-300

Dark Mode Palette:
- Background: gray-900 / gray-950
- Cards: gray-800 / gray-700
- Text: white / gray-100 / gray-300 / gray-400
- Borders: gray-700 / gray-600
```

---

## 🎯 Your Current Status

**578 dark mode class usages across 45 files** = Pretty good coverage!

**Most components already support dark mode**, but let's do a deeper check on critical ones.

---

## Next: I'll Audit & Fix

Let me check specific components that users see most:
1. Navigation
2. Authentication modal
3. Purchase button/modal
4. Collection cards
5. Story creator
6. Profile pages

I'll create fixes for any missing dark mode support!

