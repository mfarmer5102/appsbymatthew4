// Simple traffic tracking script
(function() {
  
  // Check if admin mode is enabled
  function isAdminMode() {
    // Check both localStorage and cookie for admin mode
    const localStorageAdminMode = localStorage.getItem('adminMode') === 'true';
    const cookieAdminMode = document.cookie.includes('adminMode=true');
    return localStorageAdminMode || cookieAdminMode;
  }
  
  // Send page view to backend
  async function trackPageView(page) {
    if (isAdminMode()) {
      return; // Skip tracking in admin mode
    }
    
    try {
      const response = await fetch('/api/traffic/track-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Page': page
        },
        body: JSON.stringify({
          page: page,
          timestamp: new Date().toISOString()
        })
      });
      
      // Page view tracked successfully
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }
  
  // Get current page from URL
  function getCurrentPage() {
    const path = window.location.pathname;
    return path.replace(/^\//, '') || 'home';
  }
  
  // Track initial page load
  function trackInitialPageLoad() {
    const page = getCurrentPage();
    trackPageView(page);
  }
  
  // Track navigation changes (for SPAs)
  function trackNavigationChanges() {
    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', function() {
      setTimeout(() => {
        const page = getCurrentPage();
        trackPageView(page);
      }, 100);
    });
    
    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      setTimeout(() => {
        const page = getCurrentPage();
        trackPageView(page);
      }, 100);
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      setTimeout(() => {
        const page = getCurrentPage();
        trackPageView(page);
      }, 100);
    };
  }
  
  // Initialize tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      trackInitialPageLoad();
      trackNavigationChanges();
    });
  } else {
    trackInitialPageLoad();
    trackNavigationChanges();
  }
})();
