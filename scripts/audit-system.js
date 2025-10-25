#!/usr/bin/env node

/**
 * PAN App Comprehensive Audit System
 * 
 * This script performs systematic checks across:
 * - Mobile responsiveness
 * - UI consistency
 * - Performance optimization
 * - Accessibility compliance
 * - Code quality
 * - Security best practices
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PANAuditSystem {
  constructor() {
    this.results = {
      mobile: [],
      ui: [],
      performance: [],
      accessibility: [],
      security: [],
      codeQuality: []
    };
    this.score = 0;
    this.totalChecks = 0;
  }

  // Mobile Responsiveness Audit
  async auditMobileResponsiveness() {
    console.log('🔍 Auditing Mobile Responsiveness...');
    
    const mobileChecks = [
      {
        name: 'Header Logo Centering',
        check: () => this.checkFileContent('components/AppHeader.tsx', 'flex items-center justify-center'),
        weight: 3
      },
      {
        name: 'Mobile Grid Layout',
        check: () => this.checkFileContent('components/ListingGrid.tsx', 'grid-cols-2 sm:grid-cols'),
        weight: 3
      },
      {
        name: 'Touch Target Sizes',
        check: () => this.checkFileContent('app/globals.css', 'min-height: 44px'),
        weight: 2
      },
      {
        name: 'Safe Area Support',
        check: () => this.checkFileContent('components/AppHeader.tsx', 'safe-area-top'),
        weight: 2
      },
      {
        name: 'Mobile Icon Sizing',
        check: () => this.checkFileContent('components/ListingGrid.tsx', 'flex-shrink-0'),
        weight: 2
      },
      {
        name: 'Responsive Text Scaling',
        check: () => this.checkFileContent('components/ListingGrid.tsx', 'text-\\[\\d+px\\]'),
        weight: 2
      },
      {
        name: 'Mobile Button Centering',
        check: () => this.checkFileContent('components/SaveToFolderButton.tsx', 'justify-center'),
        weight: 2
      },
      {
        name: 'Z-Index Management',
        check: () => this.checkFileContent('components/SaveToFolderButton.tsx', 'z-\\[\\d+\\]'),
        weight: 2
      }
    ];

    for (const check of mobileChecks) {
      const passed = await check.check();
      this.results.mobile.push({
        name: check.name,
        passed,
        weight: check.weight
      });
      this.totalChecks += check.weight;
      if (passed) this.score += check.weight;
    }
  }

  // UI Consistency Audit
  async auditUIConsistency() {
    console.log('🎨 Auditing UI Consistency...');
    
    const uiChecks = [
      {
        name: 'Color System Consistency',
        check: () => this.checkFileContent('app/globals.css', 'rgb\\(\\d+, \\d+, \\d+\\)'),
        weight: 2
      },
      {
        name: 'Typography Scale',
        check: () => this.checkFileContent('styles/responsive.css', 'responsive-text-'),
        weight: 2
      },
      {
        name: 'Spacing System',
        check: () => this.checkFileContent('app/globals.css', 'px-\\d+ sm:px-\\d+'),
        weight: 2
      },
      {
        name: 'Border Radius Consistency',
        check: () => this.checkFileContent('components', 'rounded-\\w+'),
        weight: 1
      },
      {
        name: 'Shadow Consistency',
        check: () => this.checkFileContent('components', 'shadow-\\w+'),
        weight: 1
      },
      {
        name: 'Dark Mode Support',
        check: () => this.checkFileContent('app/globals.css', 'dark:'),
        weight: 3
      }
    ];

    for (const check of uiChecks) {
      const passed = await check.check();
      this.results.ui.push({
        name: check.name,
        passed,
        weight: check.weight
      });
      this.totalChecks += check.weight;
      if (passed) this.score += check.weight;
    }
  }

  // Performance Audit
  async auditPerformance() {
    console.log('⚡ Auditing Performance...');
    
    const performanceChecks = [
      {
        name: 'Image Optimization',
        check: () => this.checkFileContent('components/ListingGrid.tsx', 'object-cover'),
        weight: 2
      },
      {
        name: 'Lazy Loading',
        check: () => this.checkFileContent('components', 'loading="lazy"'),
        weight: 2
      },
      {
        name: 'Code Splitting',
        check: () => this.checkFileContent('app', 'dynamic'),
        weight: 3
      },
      {
        name: 'Bundle Size Optimization',
        check: () => this.checkFileContent('next.config.js', 'optimization'),
        weight: 2
      },
      {
        name: 'CSS Optimization',
        check: () => this.checkFileContent('tailwind.config.js', 'purge'),
        weight: 1
      }
    ];

    for (const check of performanceChecks) {
      const passed = await check.check();
      this.results.performance.push({
        name: check.name,
        passed,
        weight: check.weight
      });
      this.totalChecks += check.weight;
      if (passed) this.score += check.weight;
    }
  }

  // Accessibility Audit
  async auditAccessibility() {
    console.log('♿ Auditing Accessibility...');
    
    const a11yChecks = [
      {
        name: 'Alt Text for Images',
        check: () => this.checkFileContent('components', 'alt='),
        weight: 3
      },
      {
        name: 'Focus Management',
        check: () => this.checkFileContent('app/globals.css', 'focus-visible'),
        weight: 2
      },
      {
        name: 'Keyboard Navigation',
        check: () => this.checkFileContent('components', 'tabIndex'),
        weight: 2
      },
      {
        name: 'Color Contrast',
        check: () => this.checkFileContent('app/globals.css', 'text-gray-\\d+'),
        weight: 2
      },
      {
        name: 'Screen Reader Support',
        check: () => this.checkFileContent('components', 'aria-'),
        weight: 2
      }
    ];

    for (const check of a11yChecks) {
      const passed = await check.check();
      this.results.accessibility.push({
        name: check.name,
        passed,
        weight: check.weight
      });
      this.totalChecks += check.weight;
      if (passed) this.score += check.weight;
    }
  }

  // Security Audit
  async auditSecurity() {
    console.log('🔒 Auditing Security...');
    
    const securityChecks = [
      {
        name: 'XSS Prevention',
        check: () => this.checkFileContent('components', 'dangerouslySetInnerHTML'),
        weight: 3,
        shouldFail: true // This should NOT be present
      },
      {
        name: 'CSRF Protection',
        check: () => this.checkFileContent('lib/supabase', 'csrf'),
        weight: 2
      },
      {
        name: 'Input Sanitization',
        check: () => this.checkFileContent('components', 'sanitize'),
        weight: 2
      },
      {
        name: 'Environment Variables',
        check: () => this.checkFileContent('.env', 'NEXT_PUBLIC_'),
        weight: 1
      }
    ];

    for (const check of securityChecks) {
      const passed = await check.check();
      const result = check.shouldFail ? !passed : passed;
      this.results.security.push({
        name: check.name,
        passed: result,
        weight: check.weight
      });
      this.totalChecks += check.weight;
      if (result) this.score += check.weight;
    }
  }

  // Code Quality Audit
  async auditCodeQuality() {
    console.log('📝 Auditing Code Quality...');
    
    const qualityChecks = [
      {
        name: 'TypeScript Usage',
        check: () => this.checkFileContent('components', 'interface'),
        weight: 2
      },
      {
        name: 'Error Handling',
        check: () => this.checkFileContent('components', 'try.*catch'),
        weight: 2
      },
      {
        name: 'Loading States',
        check: () => this.checkFileContent('components', 'loading'),
        weight: 2
      },
      {
        name: 'Component Props Validation',
        check: () => this.checkFileContent('components', 'PropTypes'),
        weight: 1
      },
      {
        name: 'Code Comments',
        check: () => this.checkFileContent('components', '//'),
        weight: 1
      }
    ];

    for (const check of qualityChecks) {
      const passed = await check.check();
      this.results.codeQuality.push({
        name: check.name,
        passed,
        weight: check.weight
      });
      this.totalChecks += check.weight;
      if (passed) this.score += check.weight;
    }
  }

  // Helper method to check file content
  async checkFileContent(filePath, pattern) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) return false;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const regex = new RegExp(pattern, 'i');
      return regex.test(content);
    } catch (error) {
      return false;
    }
  }

  // Generate comprehensive report
  generateReport() {
    const percentage = Math.round((this.score / this.totalChecks) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PAN APP AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${this.score}/${this.totalChecks} (${percentage}%)`);
    console.log('='.repeat(60));

    // Mobile Responsiveness
    console.log('\n📱 MOBILE RESPONSIVENESS');
    console.log('-'.repeat(30));
    this.results.mobile.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name} (${check.weight}pts)`);
    });

    // UI Consistency
    console.log('\n🎨 UI CONSISTENCY');
    console.log('-'.repeat(30));
    this.results.ui.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name} (${check.weight}pts)`);
    });

    // Performance
    console.log('\n⚡ PERFORMANCE');
    console.log('-'.repeat(30));
    this.results.performance.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name} (${check.weight}pts)`);
    });

    // Accessibility
    console.log('\n♿ ACCESSIBILITY');
    console.log('-'.repeat(30));
    this.results.accessibility.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name} (${check.weight}pts)`);
    });

    // Security
    console.log('\n🔒 SECURITY');
    console.log('-'.repeat(30));
    this.results.security.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name} (${check.weight}pts)`);
    });

    // Code Quality
    console.log('\n📝 CODE QUALITY');
    console.log('-'.repeat(30));
    this.results.codeQuality.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name} (${check.weight}pts)`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(30));
    if (percentage < 70) {
      console.log('🔴 Critical: Multiple issues need immediate attention');
    } else if (percentage < 85) {
      console.log('🟡 Good: Some improvements recommended');
    } else {
      console.log('🟢 Excellent: App is well-optimized');
    }

    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      score: this.score,
      totalChecks: this.totalChecks,
      percentage,
      results: this.results
    };

    fs.writeFileSync('audit-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: audit-report.json');
  }

  // Run all audits
  async runFullAudit() {
    console.log('🚀 Starting PAN App Comprehensive Audit...\n');
    
    await this.auditMobileResponsiveness();
    await this.auditUIConsistency();
    await this.auditPerformance();
    await this.auditAccessibility();
    await this.auditSecurity();
    await this.auditCodeQuality();
    
    this.generateReport();
  }
}

// Run the audit
if (require.main === module) {
  const audit = new PANAuditSystem();
  audit.runFullAudit().catch(console.error);
}

module.exports = PANAuditSystem;
