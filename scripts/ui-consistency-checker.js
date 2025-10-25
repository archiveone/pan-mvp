#!/usr/bin/env node

/**
 * PAN UI Consistency Checker
 * 
 * Ensures consistent design system implementation:
 * - Color usage
 * - Typography scale
 * - Spacing system
 * - Component patterns
 * - Dark mode consistency
 */

const fs = require('fs');
const path = require('path');

class UIConsistencyChecker {
  constructor() {
    this.inconsistencies = [];
    this.patterns = {
      colors: new Set(),
      spacing: new Set(),
      typography: new Set(),
      borderRadius: new Set(),
      shadows: new Set()
    };
  }

  async checkUIConsistency() {
    console.log('🎨 PAN UI Consistency Checker');
    console.log('='.repeat(40));

    await this.scanComponents();
    await this.checkColorConsistency();
    await this.checkTypographyConsistency();
    await this.checkSpacingConsistency();
    await this.checkComponentPatterns();
    await this.checkDarkModeConsistency();
    
    this.generateConsistencyReport();
  }

  async scanComponents() {
    console.log('\n🔍 Scanning Components...');
    
    const componentDir = 'components';
    const files = fs.readdirSync(componentDir).filter(f => f.endsWith('.tsx'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(componentDir, file), 'utf8');
      this.extractPatterns(content);
    }
  }

  extractPatterns(content) {
    // Extract color patterns
    const colorMatches = content.match(/text-\w+-\d+|bg-\w+-\d+|border-\w+-\d+/g);
    if (colorMatches) {
      colorMatches.forEach(color => this.patterns.colors.add(color));
    }

    // Extract spacing patterns
    const spacingMatches = content.match(/[mp][trblxy]?-\d+|gap-\d+|space-[xy]-\d+/g);
    if (spacingMatches) {
      spacingMatches.forEach(spacing => this.patterns.spacing.add(spacing));
    }

    // Extract typography patterns
    const typographyMatches = content.match(/text-\w+|font-\w+|leading-\w+/g);
    if (typographyMatches) {
      typographyMatches.forEach(typography => this.patterns.typography.add(typography));
    }

    // Extract border radius patterns
    const borderRadiusMatches = content.match(/rounded-\w+/g);
    if (borderRadiusMatches) {
      borderRadiusMatches.forEach(radius => this.patterns.borderRadius.add(radius));
    }

    // Extract shadow patterns
    const shadowMatches = content.match(/shadow-\w+/g);
    if (shadowMatches) {
      shadowMatches.forEach(shadow => this.patterns.shadows.add(shadow));
    }
  }

  async checkColorConsistency() {
    console.log('\n🎨 Checking Color Consistency...');
    
    const colorIssues = [];
    const colors = Array.from(this.patterns.colors);
    
    // Check for inconsistent color usage
    const grayVariants = colors.filter(c => c.includes('gray'));
    const blueVariants = colors.filter(c => c.includes('blue'));
    const redVariants = colors.filter(c => c.includes('red'));
    
    if (grayVariants.length > 8) {
      colorIssues.push({
        type: 'Color',
        issue: 'Too many gray variants used',
        severity: 'medium',
        fix: 'Standardize on 3-4 gray variants (gray-100, gray-500, gray-700, gray-900)'
      });
    }
    
    // Check for proper dark mode color usage
    const hasDarkMode = colors.some(c => c.includes('dark:'));
    if (!hasDarkMode) {
      colorIssues.push({
        type: 'Color',
        issue: 'Missing dark mode color variants',
        severity: 'high',
        fix: 'Add dark: variants for all colors'
      });
    }
    
    this.inconsistencies.push(...colorIssues);
  }

  async checkTypographyConsistency() {
    console.log('\n📝 Checking Typography Consistency...');
    
    const typographyIssues = [];
    const typography = Array.from(this.patterns.typography);
    
    // Check for consistent text sizing
    const textSizes = typography.filter(t => t.startsWith('text-'));
    const uniqueSizes = new Set(textSizes);
    
    if (uniqueSizes.size > 10) {
      typographyIssues.push({
        type: 'Typography',
        issue: 'Too many text size variants',
        severity: 'medium',
        fix: 'Standardize on 5-6 text sizes (xs, sm, base, lg, xl, 2xl)'
      });
    }
    
    // Check for consistent font weights
    const fontWeights = typography.filter(t => t.startsWith('font-'));
    const weightVariants = new Set(fontWeights);
    
    if (weightVariants.size > 4) {
      typographyIssues.push({
        type: 'Typography',
        issue: 'Too many font weight variants',
        severity: 'low',
        fix: 'Standardize on 3-4 weights (normal, medium, semibold, bold)'
      });
    }
    
    this.inconsistencies.push(...typographyIssues);
  }

  async checkSpacingConsistency() {
    console.log('\n📏 Checking Spacing Consistency...');
    
    const spacingIssues = [];
    const spacing = Array.from(this.patterns.spacing);
    
    // Check for consistent spacing scale
    const spacingValues = spacing.map(s => {
      const match = s.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    }).filter(v => v > 0);
    
    const uniqueValues = new Set(spacingValues);
    
    if (uniqueValues.size > 12) {
      spacingIssues.push({
        type: 'Spacing',
        issue: 'Too many spacing values used',
        severity: 'medium',
        fix: 'Use consistent spacing scale (1, 2, 3, 4, 6, 8, 12, 16, 20, 24)'
      });
    }
    
    // Check for mobile-responsive spacing
    const hasResponsiveSpacing = spacing.some(s => s.includes('sm:') || s.includes('md:'));
    if (!hasResponsiveSpacing) {
      spacingIssues.push({
        type: 'Spacing',
        issue: 'Missing responsive spacing',
        severity: 'medium',
        fix: 'Add responsive spacing variants (sm:, md:, lg:)'
      });
    }
    
    this.inconsistencies.push(...spacingIssues);
  }

  async checkComponentPatterns() {
    console.log('\n🧩 Checking Component Patterns...');
    
    const componentIssues = [];
    
    // Check for consistent button patterns
    const buttonFiles = ['components/SaveToFolderButton.tsx', 'components/BottomNav.tsx'];
    for (const file of buttonFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (!content.includes('rounded-') || !content.includes('transition-')) {
          componentIssues.push({
            type: 'Component',
            file,
            issue: 'Button missing consistent styling',
            severity: 'medium',
            fix: 'Add rounded corners and transitions to buttons'
          });
        }
      }
    }
    
    // Check for consistent card patterns
    const cardFiles = ['components/ListingGrid.tsx', 'components/ListingCard.tsx'];
    for (const file of cardFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (!content.includes('shadow-') || !content.includes('rounded-')) {
          componentIssues.push({
            type: 'Component',
            file,
            issue: 'Card missing consistent styling',
            severity: 'medium',
            fix: 'Add shadows and rounded corners to cards'
          });
        }
      }
    }
    
    this.inconsistencies.push(...componentIssues);
  }

  async checkDarkModeConsistency() {
    console.log('\n🌙 Checking Dark Mode Consistency...');
    
    const darkModeIssues = [];
    
    // Check if dark mode is properly implemented
    const globalsCSS = 'app/globals.css';
    if (fs.existsSync(globalsCSS)) {
      const content = fs.readFileSync(globalsCSS, 'utf8');
      
      if (!content.includes('dark:') || !content.includes('.dark')) {
        darkModeIssues.push({
          type: 'Dark Mode',
          issue: 'Incomplete dark mode implementation',
          severity: 'high',
          fix: 'Add comprehensive dark mode styles'
        });
      }
    }
    
    // Check component dark mode support
    const componentFiles = ['components/AppHeader.tsx', 'components/ListingGrid.tsx'];
    for (const file of componentFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (!content.includes('dark:')) {
          darkModeIssues.push({
            type: 'Dark Mode',
            file,
            issue: 'Component missing dark mode support',
            severity: 'medium',
            fix: 'Add dark: variants to component classes'
          });
        }
      }
    }
    
    this.inconsistencies.push(...darkModeIssues);
  }

  generateConsistencyReport() {
    console.log('\n' + '='.repeat(50));
    console.log('🎨 UI CONSISTENCY REPORT');
    console.log('='.repeat(50));
    
    // Show pattern usage
    console.log('\n📊 PATTERN USAGE:');
    console.log(`Colors: ${this.patterns.colors.size} variants`);
    console.log(`Spacing: ${this.patterns.spacing.size} variants`);
    console.log(`Typography: ${this.patterns.typography.size} variants`);
    console.log(`Border Radius: ${this.patterns.borderRadius.size} variants`);
    console.log(`Shadows: ${this.patterns.shadows.size} variants`);
    
    if (this.inconsistencies.length === 0) {
      console.log('\n✅ No UI consistency issues found!');
      return;
    }
    
    // Group by severity
    const high = this.inconsistencies.filter(i => i.severity === 'high');
    const medium = this.inconsistencies.filter(i => i.severity === 'medium');
    const low = this.inconsistencies.filter(i => i.severity === 'low');
    
    console.log(`\n🔴 High Priority Issues (${high.length}):`);
    high.forEach(issue => {
      console.log(`  • ${issue.type}: ${issue.issue}`);
      console.log(`    Fix: ${issue.fix}\n`);
    });
    
    console.log(`🟡 Medium Priority Issues (${medium.length}):`);
    medium.forEach(issue => {
      console.log(`  • ${issue.type}: ${issue.issue}`);
      console.log(`    Fix: ${issue.fix}\n`);
    });
    
    console.log(`🟢 Low Priority Issues (${low.length}):`);
    low.forEach(issue => {
      console.log(`  • ${issue.type}: ${issue.issue}`);
      console.log(`    Fix: ${issue.fix}\n`);
    });
    
    // Design system recommendations
    console.log('\n💡 DESIGN SYSTEM RECOMMENDATIONS:');
    console.log('-'.repeat(40));
    
    if (this.patterns.colors.size > 20) {
      console.log('🎨 Consider creating a color palette with 8-12 primary colors');
    }
    
    if (this.patterns.spacing.size > 15) {
      console.log('📏 Standardize on a 8-point spacing scale');
    }
    
    if (this.patterns.typography.size > 15) {
      console.log('📝 Create a typography scale with 5-6 sizes');
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      patterns: {
        colors: Array.from(this.patterns.colors),
        spacing: Array.from(this.patterns.spacing),
        typography: Array.from(this.patterns.typography),
        borderRadius: Array.from(this.patterns.borderRadius),
        shadows: Array.from(this.patterns.shadows)
      },
      inconsistencies: this.inconsistencies
    };
    
    fs.writeFileSync('ui-consistency-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed UI consistency report saved to: ui-consistency-report.json');
  }
}

// Run the UI consistency checker
if (require.main === module) {
  const checker = new UIConsistencyChecker();
  checker.checkUIConsistency().catch(console.error);
}

module.exports = UIConsistencyChecker;
