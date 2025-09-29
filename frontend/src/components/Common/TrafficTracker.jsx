import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '../Layout/Layout';

const TrafficTracker = () => {
  const location = useLocation();
  const { isAdminMode } = useAdmin();

  // Component initialized

  useEffect(() => {
    // Set admin mode cookie for backend to read
    if (isAdminMode) {
      document.cookie = 'adminMode=true; path=/; max-age=86400'; // 24 hours
    } else {
      document.cookie = 'adminMode=false; path=/; max-age=86400';
    }
  }, [isAdminMode]);

  useEffect(() => {
    // Track page views by sending a request to the backend
    const trackPageView = async () => {
      if (isAdminMode) {
        return; // Don't track in admin mode
      }
      
      try {
        // Send a request to track the page view
        const response = await fetch('/api/traffic/track-page', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Page': location.pathname.replace(/^\//, '') || 'home'
          },
          body: JSON.stringify({
            page: location.pathname.replace(/^\//, '') || 'home',
            timestamp: new Date().toISOString()
          })
        });
        
        // Page view tracked successfully
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [location, isAdminMode]);

  // Track user interactions
  useEffect(() => {
    const trackInteraction = (event) => {
      const target = event.target;
      
      // Track filter interactions
      if (target.matches('select[data-filter]')) {
        const filter = target.dataset.filter;
        const value = target.value;
        console.log('Filter interaction:', { filter, value });
      }
      
      // Track search interactions
      if (target.matches('input[type="search"], input[data-search]')) {
        const searchTerm = target.value;
        if (searchTerm.length > 2) {
          console.log('Search interaction:', searchTerm);
        }
      }
      
      // Track sort interactions
      if (target.matches('button[data-sort], select[data-sort]')) {
        const sort = target.dataset.sort;
        const order = target.dataset.order || 'asc';
        console.log('Sort interaction:', { sort, order });
      }
    };

    // Add event listeners for user interactions
    document.addEventListener('change', trackInteraction);
    document.addEventListener('click', trackInteraction);

    return () => {
      document.removeEventListener('change', trackInteraction);
      document.removeEventListener('click', trackInteraction);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default TrafficTracker;
