const Traffic = require('../models/Traffic');
const { v4: uuidv4 } = require('uuid');

console.log('🔍 TRAFFIC TRACKER MIDDLEWARE LOADED');

// Helper function to detect device type
const getDeviceType = (userAgent) => {
  if (/tablet/i.test(userAgent)) {
    return 'Tablet';
  } else if (/mobile/i.test(userAgent)) {
    return 'Mobile';
  } else {
    return 'Desktop';
  }
};

// Helper function to get browser info
const getBrowserInfo = (userAgent) => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
};

// Helper function to get OS info
const getOSInfo = (userAgent) => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Other';
};

// Helper function to get location (simplified - in production you'd use a geolocation service)
const getLocation = (ip) => {
  // For now, return a default location
  // In production, you'd use a service like MaxMind GeoIP2 or similar
  return 'United States';
};

// Middleware to track traffic
const trackTraffic = async (req, res, next) => {
  console.log(`🔍 TRAFFIC MIDDLEWARE EXECUTING: ${req.method} ${req.path}`);
  try {
    console.log(`🔍 Middleware called for: ${req.method} ${req.path}`);
    
    // Skip tracking for certain paths
    const skipPaths = ['/health', '/api/traffic/analytics', '/api/traffic/recent', '/favicon.ico'];
    if (skipPaths.some(path => req.path.startsWith(path))) {
      console.log(`🔍 Skipping ${req.path} - in skipPaths`);
      return next();
    }

    // Skip tracking if admin mode is enabled (check for admin cookie or header)
    const isAdminMode = req.cookies?.adminMode === 'true' || req.headers['x-admin-mode'] === 'true';
    if (isAdminMode) {
      console.log(`🔍 Skipping ${req.path} - admin mode enabled`);
      return next();
    }

    // Track both the explicit page tracking endpoint and API calls with non-default parameters
    const isTrackPageEndpoint = req.path === '/api/traffic/track-page';
    const isApiCallWithParams = req.path.startsWith('/api/') && 
      !req.path.startsWith('/api/traffic/') && 
      (req.query.filter || req.query.sort || req.query.search || req.query.page);
    
    if (!isTrackPageEndpoint && !isApiCallWithParams) {
      console.log(`🔍 Skipping ${req.path} - not trackable endpoint`);
      return next();
    }

    console.log(`🔍 Tracking page view: ${req.method} ${req.path} from IP: ${req.ip || 'unknown'}`);

    // Determine the actual page being viewed
    let actualPage = 'home';
    
    if (isTrackPageEndpoint) {
      // For explicit page tracking requests, use the page from headers or body
      const pageFromHeader = req.headers['x-page'] || req.headers['x-current-page'];
      if (pageFromHeader) {
        actualPage = pageFromHeader;
      } else if (req.body && req.body.page) {
        actualPage = req.body.page;
      } else if (req.query.page) {
        actualPage = req.query.page;
      }
    } else if (isApiCallWithParams) {
      // For API calls with parameters, determine page from the API endpoint
      if (req.path.includes('/applications')) {
        actualPage = 'applications';
      } else if (req.path.includes('/skills')) {
        actualPage = 'skills';
      } else if (req.path.includes('/skill-types')) {
        actualPage = 'skill-types';
      } else if (req.path.includes('/support-status')) {
        actualPage = 'support-status';
      } else {
        actualPage = req.path.replace(/^\/api\//, '').replace(/\/.*$/, '');
      }
    }

    // Extract user agent info
    const userAgent = req.get('User-Agent') || '';
    const device = getDeviceType(userAgent);
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const location = getLocation(ip);

    // Find or create traffic record for this IP address
    let trafficRecord = await Traffic.findOne({ ip_address: ip });

    const page = actualPage;
    const query = req.query;
    const now = new Date();
    
    console.log(`🔍 Tracking traffic: ${req.method} ${req.path} -> Page: ${page} from IP: ${ip}`);
    
    // Create a page_view action only for explicit page tracking requests
    const pageViewAction = isTrackPageEndpoint ? {
      action: 'page_view',
      page,
      timestamp: now
    } : null;

    if (trafficRecord) {
      // Use atomic update to avoid version conflicts
      const updateData = {
        $set: {
          last_visit: now
        },
        $inc: {
          total_visits: 1
        }
      };

      // Check if this page was already viewed in the last 5 minutes to avoid duplicate page views
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const recentPageView = trafficRecord.actions.find(action => 
        action.action === 'page_view' && 
        action.page === page && 
        new Date(action.timestamp) > fiveMinutesAgo
      );

      // Only add page view if it's a new page or enough time has passed (and we have a page view action)
      if (pageViewAction && !recentPageView) {
        updateData.$push = { actions: pageViewAction };
      }

      // Collect all actions to add (only non-default values)
      const actionsToAdd = [];

      // Add filter action only if it's not a default value
      if (query.filter && query.filter !== 'all' && query.filter !== '') {
        actionsToAdd.push({
          action: 'filter',
          page,
          filter: query.filter,
          value: query.value || query.filter,
          timestamp: now
        });
      }

      // Add sort action only if it's not default (name asc)
      if (query.sort && !(query.sort === 'name' && (query.order === 'asc' || !query.order))) {
        actionsToAdd.push({
          action: 'sort',
          page,
          sort: query.sort,
          order: query.order || 'asc',
          timestamp: now
        });
      }

      // Add pagination action only if it's not default (page 1, limit 20)
      const pageNum = parseInt(query.page) || 1;
      const pageSize = parseInt(query.limit) || 20;
      if (pageNum > 1 || pageSize !== 20) {
        actionsToAdd.push({
          action: 'pagination',
          page,
          page_number: pageNum,
          page_size: pageSize,
          timestamp: now
        });
      }

      // Add search action only if there's actual search text
      if (query.search && query.search.trim().length > 0) {
        actionsToAdd.push({
          action: 'search',
          page,
          search: query.search.trim(),
          timestamp: now
        });
      }

      // Add all actions at once
      if (actionsToAdd.length > 0) {
        updateData.$push = updateData.$push || {};
        updateData.$push.actions = { $each: actionsToAdd };
      }

      // Update user agent info atomically
      const existingUserAgent = trafficRecord.user_agents.find(ua => 
        ua.user_agent === userAgent
      );

      if (existingUserAgent) {
        // Use arrayFilters to update specific user agent
        await Traffic.updateOne(
          { _id: trafficRecord._id, 'user_agents.user_agent': userAgent },
          {
            $inc: { 'user_agents.$.visit_count': 1 },
            $set: { 'user_agents.$.last_seen': now }
          }
        );
      } else {
        updateData.$push = updateData.$push || {};
        updateData.$push.user_agents = {
          user_agent: userAgent,
          os,
          browser,
          device,
          first_seen: now,
          last_seen: now,
          visit_count: 1
        };
      }

      await Traffic.updateOne({ _id: trafficRecord._id }, updateData);
    } else {
      // Create new traffic record for this IP address
      const actions = pageViewAction ? [pageViewAction] : [];

      // Add additional actions based on query parameters (only non-default values)
      if (query.filter && query.filter !== 'all' && query.filter !== '') {
        actions.push({
          action: 'filter',
          page,
          filter: query.filter,
          value: query.value || query.filter,
          timestamp: now
        });
      }

      if (query.sort && !(query.sort === 'name' && (query.order === 'asc' || !query.order))) {
        actions.push({
          action: 'sort',
          page,
          sort: query.sort,
          order: query.order || 'asc',
          timestamp: now
        });
      }

      const pageNum = parseInt(query.page) || 1;
      const pageSize = parseInt(query.limit) || 20;
      if (pageNum > 1 || pageSize !== 20) {
        actions.push({
          action: 'pagination',
          page,
          page_number: pageNum,
          page_size: pageSize,
          timestamp: now
        });
      }

      if (query.search && query.search.trim().length > 0) {
        actions.push({
          action: 'search',
          page,
          search: query.search.trim(),
          timestamp: now
        });
      }

      trafficRecord = new Traffic({
        ip_address: ip,
        first_visit: now,
        last_visit: now,
        total_visits: 1,
        user_agents: [{
          user_agent: userAgent,
          os,
          browser,
          device,
          first_seen: now,
          last_seen: now,
          visit_count: 1
        }],
        location,
        actions
      });
      await trafficRecord.save();
    }

    next();
  } catch (error) {
    // Don't let traffic tracking errors break the app
    console.error('Traffic tracking error:', error);
    next();
  }
};

module.exports = trackTraffic;
