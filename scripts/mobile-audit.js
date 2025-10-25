#!/usr/bin/env node

/**
 * PAN Mobile-Specific Audit Tool
 * 
 * Focuses specifically on mobile responsiveness issues:
 * - Touch targets
 * - Viewport handling
 * - Mobile-specific CSS
 * - Responsive breakpoints
 * - Mobile performance
 */

const fs = require('fs');
const path = require('path');

class MobileAuditTool {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  // Check mobile-specific issues
  async auditMobileIssues() {
    console.log('📱 PAN Mobile Audit Tool');
    console.log('='.repeat(40));

    await this.checkTouchTargets();
    await this.checkViewportHandling();
    await this.checkMobileCSS();
    await this.checkResponsiveBreakpoints();
    await this.checkMobilePerformance();
    await this.checkMobileNavigation();
    await this.checkMobileForms();
    await this.checkMobileImages();
    
    this.generateMobileReport();
  }

  async checkTouchTargets() {
    console.log('\n👆 Checking Touch Targets...');
    
    const files = ['components/ListingGrid.tsx', 'components/SaveToFolderButton.tsx', 'components/BottomNav.tsx'];
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for minimum touch target size
        if (!content.includes('min-h-[44px]') && !content.includes('h-11') && !content.includes('h-12')) {
          this.issues.push({
            type: 'Touch Target',
            file,
            issue: 'Missing minimum 44px touch target',
            severity: 'high',
            fix: 'Add min-h-[44px] or h-11/h-12 classes to interactive elements'
          });
        }
        
        // Check for proper spacing between touch targets
        if (content.includes('gap-1') || content.includes('gap-0.5')) {
          this.issues.push({
            type: 'Touch Target',
            file,
            issue: 'Insufficient spacing between touch targets',
            severity: 'medium',
            fix: 'Increase gap to at least gap-2 for mobile'
          });
        }
      }
    }
  }

  async checkViewportHandling() {
    console.log('\n📐 Checking Viewport Handling...');
    
    const htmlFile = 'app/layout.tsx';
    if (fs.existsSync(htmlFile)) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      
      if (!content.includes('viewport') && !content.includes('width=device-width')) {
        this.issues.push({
          type: 'Viewport',
          file: htmlFile,
          issue: 'Missing viewport meta tag',
          severity: 'critical',
          fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1" />'
        });
      }
    }
  }

  async checkMobileCSS() {
    console.log('\n🎨 Checking Mobile CSS...');
    
    const cssFiles = ['app/globals.css', 'styles/responsive.css'];
    
    for (const file of cssFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for mobile-first approach
        if (!content.includes('@media (max-width: 640px)')) {
          this.issues.push({
            type: 'CSS',
            file,
            issue: 'Missing mobile-first media queries',
            severity: 'medium',
            fix: 'Add @media (max-width: 640px) for mobile styles'
          });
        }
        
        // Check for safe area support
        if (!content.includes('safe-area') && !content.includes('env(safe-area')) {
          this.issues.push({
            type: 'CSS',
            file,
            issue: 'Missing safe area support for notched devices',
            severity: 'medium',
            fix: 'Add safe-area-inset-top/bottom support'
          });
        }
      }
    }
  }

  async checkResponsiveBreakpoints() {
    console.log('\n📏 Checking Responsive Breakpoints...');
    
    const files = ['components/ListingGrid.tsx', 'components/AppHeader.tsx'];
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for proper breakpoint usage
        const breakpoints = ['sm:', 'md:', 'lg:', 'xl:'];
        const hasBreakpoints = breakpoints.some(bp => content.includes(bp));
        
        if (!hasBreakpoints) {
          this.issues.push({
            type: 'Responsive',
            file,
            issue: 'Missing responsive breakpoints',
            severity: 'high',
            fix: 'Add sm:, md:, lg: breakpoints for responsive design'
          });
        }
        
        // Check for mobile-first approach
        if (content.includes('md:') && !content.includes('sm:')) {
          this.issues.push({
            type: 'Responsive',
            file,
            issue: 'Not using mobile-first approach',
            severity: 'medium',
            fix: 'Start with mobile styles, then add sm:, md: etc.'
          });
        }
      }
    }
  }

  async checkMobilePerformance() {
    console.log('\n⚡ Checking Mobile Performance...');
    
    const files = ['components/ListingGrid.tsx', 'app/page.tsx'];
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for image optimization
        if (content.includes('<img') && !content.includes('loading="lazy"')) {
          this.issues.push({
            type: 'Performance',
            file,
            issue: 'Images not lazy loaded',
            severity: 'medium',
            fix: 'Add loading="lazy" to img tags'
          });
        }
        
        // Check for proper image sizing
        if (content.includes('<img') && !content.includes('object-cover')) {
          this.issues.push({
            type: 'Performance',
            file,
            issue: 'Images missing object-cover for proper sizing',
            severity: 'low',
            fix: 'Add object-cover class to images'
          });
        }
      }
    }
  }

  async checkMobileNavigation() {
    console.log('\n🧭 Checking Mobile Navigation...');
    
    const navFile = 'components/BottomNav.tsx';
    if (fs.existsSync(navFile)) {
      const content = fs.readFileSync(navFile, 'utf8');
      
      // Check for proper mobile nav structure
      if (!content.includes('fixed bottom-0')) {
        this.issues.push({
          type: 'Navigation',
          file: navFile,
          issue: 'Bottom navigation not properly positioned',
          severity: 'high',
          fix: 'Use fixed bottom-0 for mobile navigation'
        });
      }
      
      // Check for safe area support
      if (!content.includes('safe-area-bottom')) {
        this.issues.push({
          type: 'Navigation',
          file: navFile,
          issue: 'Missing safe area support for bottom navigation',
          severity: 'medium',
          fix: 'Add safe-area-bottom class'
        });
      }
    }
  }

  async checkMobileForms() {
    console.log('\n📝 Checking Mobile Forms...');
    
    const formFiles = ['components/AuthModal.tsx', 'components/StoryCreator.tsx'];
    
    for (const file of formFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for proper input sizing
        if (content.includes('input') && !content.includes('text-base')) {
          this.issues.push({
            type: 'Forms',
            file,
            issue: 'Input fields may be too small on mobile',
            severity: 'medium',
            fix: 'Add text-base class to prevent zoom on iOS'
          });
        }
      }
    }
  }

  async checkMobileImages() {
    console.log('\n🖼️ Checking Mobile Images...');
    
    const imageFiles = ['components/ListingGrid.tsx', 'components/ListingCard.tsx'];
    
    for (const file of imageFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for aspect ratio handling
        if (content.includes('aspect-square') && !content.includes('aspect-ratio')) {
          this.issues.push({
            type: 'Images',
            file,
            issue: 'Using aspect-square may cause issues on some mobile browsers',
            severity: 'low',
            fix: 'Consider using aspect-ratio CSS property for better support'
          });
        }
      }
    }
  }

  generateMobileReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📱 MOBILE AUDIT REPORT');
    console.log('='.repeat(50));
    
    if (this.issues.length === 0) {
      console.log('✅ No mobile issues found! Your app is mobile-ready.');
      return;
    }
    
    // Group issues by severity
    const critical = this.issues.filter(i => i.severity === 'critical');
    const high = this.issues.filter(i => i.severity === 'high');
    const medium = this.issues.filter(i => i.severity === 'medium');
    const low = this.issues.filter(i => i.severity === 'low');
    
    console.log(`\n🔴 Critical Issues (${critical.length}):`);
    critical.forEach(issue => {
      console.log(`  • ${issue.type} in ${issue.file}`);
      console.log(`    ${issue.issue}`);
      console.log(`    Fix: ${issue.fix}\n`);
    });
    
    console.log(`🟠 High Priority Issues (${high.length}):`);
    high.forEach(issue => {
      console.log(`  • ${issue.type} in ${issue.file}`);
      console.log(`    ${issue.issue}`);
      console.log(`    Fix: ${issue.fix}\n`);
    });
    
    console.log(`🟡 Medium Priority Issues (${medium.length}):`);
    medium.forEach(issue => {
      console.log(`  • ${issue.type} in ${issue.file}`);
      console.log(`    ${issue.issue}`);
      console.log(`    Fix: ${issue.fix}\n`);
    });
    
    console.log(`🟢 Low Priority Issues (${low.length}):`);
    low.forEach(issue => {
      console.log(`  • ${issue.type} in ${issue.file}`);
      console.log(`    ${issue.issue}`);
      console.log(`    Fix: ${issue.fix}\n`);
    });
    
    // Generate recommendations
    console.log('\n💡 MOBILE OPTIMIZATION RECOMMENDATIONS:');
    console.log('-'.repeat(40));
    
    if (critical.length > 0) {
      console.log('🚨 URGENT: Fix critical issues immediately');
    }
    
    if (high.length > 0) {
      console.log('⚡ HIGH: Address high-priority issues for better mobile UX');
    }
    
    if (medium.length > 0) {
      console.log('📱 MEDIUM: Improve mobile experience with medium-priority fixes');
    }
    
    if (low.length > 0) {
      console.log('✨ LOW: Polish mobile experience with low-priority improvements');
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
      issues: this.issues
    };
    
    fs.writeFileSync('mobile-audit-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed mobile audit saved to: mobile-audit-report.json');
  }
}

// Run the mobile audit
if (require.main === module) {
  const audit = new MobileAuditTool();
  audit.auditMobileIssues().catch(console.error);
}

module.exports = MobileAuditTool;
