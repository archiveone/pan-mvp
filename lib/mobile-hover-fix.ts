/**
 * Mobile Hover Fix
 * Prevents hover states from staying active on touch devices
 */

export function initMobileHoverFix() {
  // Check if device supports hover
  const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouch && !hasHover) {
    // Add class to body to identify touch devices
    document.body.classList.add('touch-device');
    
    // Remove hover classes that might cause issues
    const hoverElements = document.querySelectorAll('[class*="hover:"], [class*="group-hover:"]');
    
    hoverElements.forEach(element => {
      // Add touch-friendly class
      element.classList.add('touch-manipulation');
      
      // Handle touch events to simulate hover behavior
      element.addEventListener('touchstart', (e) => {
        // Add active state
        element.classList.add('touch-active');
        
        // Remove after touch ends
        setTimeout(() => {
          element.classList.remove('touch-active');
        }, 300);
      });
    });
  }
}

/**
 * CSS classes for touch device handling
 */
export const touchDeviceCSS = `
  /* Touch device specific styles */
  .touch-device .group-hover\\:opacity-100 {
    opacity: 1 !important;
  }
  
  .touch-device .group-hover\\:bg-white\\/30 {
    background-color: rgba(255, 255, 255, 0.3) !important;
  }
  
  .touch-device .group-hover\\:scale-105 {
    transform: scale(1.05) !important;
  }
  
  .touch-device .group-hover\\:shadow-2xl {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  }
  
  /* Active states for touch feedback */
  .touch-active {
    transform: scale(0.98) !important;
  }
  
  .touch-active .group-hover\\:opacity-100 {
    opacity: 1 !important;
  }
  
  .touch-active .group-hover\\:bg-white\\/30 {
    background-color: rgba(255, 255, 255, 0.3) !important;
  }
  
  /* Disable hover effects on touch devices */
  .touch-device .hover\\:shadow-xl:hover,
  .touch-device .hover\\:scale-\\[1\\.02\\]:hover {
    box-shadow: initial !important;
    transform: none !important;
  }
`;

/**
 * Initialize the mobile hover fix
 */
export function setupMobileHoverFix() {
  // Add CSS to head
  const style = document.createElement('style');
  style.textContent = touchDeviceCSS;
  document.head.appendChild(style);
  
  // Initialize the fix
  initMobileHoverFix();
  
  // Re-run on resize (orientation change)
  window.addEventListener('resize', initMobileHoverFix);
}

/**
 * Component hook for mobile hover fix
 */
export function useMobileHoverFix() {
  React.useEffect(() => {
    setupMobileHoverFix();
  }, []);
}
