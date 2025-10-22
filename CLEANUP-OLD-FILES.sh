#!/bin/bash

# Script to clean up old debug and superseded SQL files
# Review this list before running!

echo "🧹 Cleaning up old debug and migration files..."

# Create backup directory first
mkdir -p archive/old-migrations
mkdir -p archive/debug-files

# Move debug files
mv FORCE-DISABLE-RLS-ON-POSTS.sql archive/debug-files/ 2>/dev/null
mv CREATE-TEST-POST-NOW.sql archive/debug-files/ 2>/dev/null
mv QUICK-FIX-SHOW-ALL-POSTS.sql archive/debug-files/ 2>/dev/null
mv ENABLE-POSTS-RLS-PROPERLY.sql archive/debug-files/ 2>/dev/null
mv DEBUG-FEED-ISSUE.md archive/debug-files/ 2>/dev/null

# Move old migration files
mv FIX-PROFILE-RLS.sql archive/old-migrations/ 2>/dev/null
mv FIX-ALL-ERRORS-NOW.sql archive/old-migrations/ 2>/dev/null
mv FIX-ALL-RLS-COMPREHENSIVE.sql archive/old-migrations/ 2>/dev/null
mv CHECK-AND-FIX-HUB.sql archive/old-migrations/ 2>/dev/null
mv FIX-HUB-BOXES-RLS.sql archive/old-migrations/ 2>/dev/null
mv SETUP-DATABASE-ALL-IN-ONE.sql archive/old-migrations/ 2>/dev/null
mv SETUP-DATABASE-CLEAN.sql archive/old-migrations/ 2>/dev/null
mv SETUP-TABLES-ONLY.sql archive/old-migrations/ 2>/dev/null
mv CREATE-TABLES-ONE-BY-ONE.md archive/old-migrations/ 2>/dev/null

# Move old e-commerce files
mv 1-CREATE-MARKETPLACE.sql archive/old-migrations/ 2>/dev/null
mv 2-CREATE-ORDERS.sql archive/old-migrations/ 2>/dev/null
mv 3-CREATE-TICKETS.sql archive/old-migrations/ 2>/dev/null
mv 4-CREATE-BOOKINGS-LIBRARY.sql archive/old-migrations/ 2>/dev/null
mv SETUP-FULL-ECOMMERCE-TABLES.sql archive/old-migrations/ 2>/dev/null
mv SETUP-MISSING-TABLES.sql archive/old-migrations/ 2>/dev/null

# Move old documentation
mv CREATE-HUB-TABLES.sql archive/old-migrations/ 2>/dev/null

echo "✅ Cleanup complete!"
echo ""
echo "📦 Old files moved to:"
echo "   - archive/debug-files/"
echo "   - archive/old-migrations/"
echo ""
echo "🌟 Current working files remain in root"

