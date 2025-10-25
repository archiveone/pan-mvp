#!/usr/bin/env node

/**
 * PAN Quick Fix Generator
 * 
 * Automatically generates fixes for common issues found in audits
 */

const fs = require('fs');
const path = require('path');

class QuickFixGenerator {
  constructor() {
    this.fixes = [];
  }

  generateMobileFixes() {
    return {
      'touch-targets': {
        description: 'Add minimum 44px touch targets',
        fix: 'Add min-h-[44px] or h-11/h-12 classes to interactive elements',
        example: 'className="min-h-[44px] px-4 py-2"'
      },
      'safe-area': {
        description: 'Add safe area support for notched devices',
        fix: 'Add safe-area-top and safe-area-bottom classes',
        example: 'className="safe-area-top safe-area-bottom"'
      },
      'mobile-spacing': {
        description: 'Fix mobile spacing issues',
        fix: 'Use responsive spacing with sm:, md: breakpoints',
        example: 'className="p-2 sm:p-4"'
      }
    };
  }

  generateUIFixes() {
    return {
      'color-consistency': {
        description: 'Standardize color usage',
        fix: 'Use consistent color palette (gray-100, gray-500, gray-700, gray-900)',
        example: 'className="text-gray-700 dark:text-gray-300"'
      },
      'typography-scale': {
        description: 'Standardize typography',
        fix: 'Use consistent text sizes (xs, sm, base, lg, xl)',
        example: 'className="text-sm sm:text-base"'
      },
      'spacing-system': {
        description: 'Use consistent spacing',
        fix: 'Use 8-point spacing scale (1, 2, 3, 4, 6, 8, 12, 16)',
        example: 'className="p-4 sm:p-6"'
      }
    };
  }

  generatePerformanceFixes() {
    return {
      'image-optimization': {
        description: 'Optimize images for mobile',
        fix: 'Add lazy loading and proper sizing',
        example: '<img loading="lazy" className="object-cover" />'
      },
      'bundle-optimization': {
        description: 'Optimize bundle size',
        fix: 'Use dynamic imports and code splitting',
        example: 'const Component = dynamic(() => import("./Component"))'
      }
    };
  }

  generateAllFixes() {
    console.log('🔧 PAN Quick Fix Generator');
    console.log('='.repeat(40));
    
    const mobileFixes = this.generateMobileFixes();
    const uiFixes = this.generateUIFixes();
    const performanceFixes = this.generatePerformanceFixes();
    
    console.log('\n📱 MOBILE FIXES:');
    Object.entries(mobileFixes).forEach(([key, fix]) => {
      console.log(`\n${key}:`);
      console.log(`  Description: ${fix.description}`);
      console.log(`  Fix: ${fix.fix}`);
      console.log(`  Example: ${fix.example}`);
    });
    
    console.log('\n🎨 UI FIXES:');
    Object.entries(uiFixes).forEach(([key, fix]) => {
      console.log(`\n${key}:`);
      console.log(`  Description: ${fix.description}`);
      console.log(`  Fix: ${fix.fix}`);
      console.log(`  Example: ${fix.example}`);
    });
    
    console.log('\n⚡ PERFORMANCE FIXES:');
    Object.entries(performanceFixes).forEach(([key, fix]) => {
      console.log(`\n${key}:`);
      console.log(`  Description: ${fix.description}`);
      console.log(`  Fix: ${fix.fix}`);
      console.log(`  Example: ${fix.example}`);
    });
    
    // Save fixes to file
    const allFixes = {
      mobile: mobileFixes,
      ui: uiFixes,
      performance: performanceFixes,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('quick-fixes.json', JSON.stringify(allFixes, null, 2));
    console.log('\n📄 Quick fixes saved to: quick-fixes.json');
  }
}

// Run the quick fix generator
if (require.main === module) {
  const generator = new QuickFixGenerator();
  generator.generateAllFixes();
}

module.exports = QuickFixGenerator;
