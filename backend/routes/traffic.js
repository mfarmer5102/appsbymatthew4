const express = require('express');
const router = express.Router();
const Traffic = require('../models/Traffic');

// Track page view endpoint
router.post('/track-page', async (req, res) => {
  try {
    // This endpoint is just for triggering the middleware
    // The actual tracking is handled by the trafficTracker middleware
    res.json({ success: true, message: 'Page view tracked' });
  } catch (error) {
    console.error('Error in track-page endpoint:', error);
    res.status(500).json({ error: 'Failed to track page view' });
  }
});

// Get traffic analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d', limit = 100 } = req.query;
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get basic traffic stats
    const totalVisits = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: '$total_visits' }
        }
      }
    ]);

    const uniqueVisitors = await Traffic.countDocuments({
      last_visit: { $gte: startDate }
    });

    // Get page views by page
    const pageViews = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      { $unwind: '$actions' },
      {
        $match: {
          'actions.action': 'page_view',
          'actions.timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$actions.page',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get actions by type
    const actionsByType = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      { $unwind: '$actions' },
      {
        $match: {
          'actions.timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$actions.action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get device breakdown
    const deviceBreakdown = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      { $unwind: '$user_agents' },
      {
        $group: {
          _id: '$user_agents.device',
          count: { $sum: '$user_agents.visit_count' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get browser breakdown
    const browserBreakdown = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      { $unwind: '$user_agents' },
      {
        $group: {
          _id: '$user_agents.browser',
          count: { $sum: '$user_agents.visit_count' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get OS breakdown
    const osBreakdown = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      { $unwind: '$user_agents' },
      {
        $group: {
          _id: '$user_agents.os',
          count: { $sum: '$user_agents.visit_count' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get location breakdown
    const locationBreakdown = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$location',
          count: { $sum: '$total_visits' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get hourly traffic for the last 24 hours
    const hourlyTraffic = await Traffic.aggregate([
      {
        $match: {
          last_visit: { 
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$last_visit' },
            day: { $dayOfMonth: '$last_visit' }
          },
          count: { $sum: '$total_visits' }
        }
      },
      { $sort: { '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Get search terms
    const searchTerms = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      { $unwind: '$actions' },
      {
        $match: {
          'actions.action': 'search',
          'actions.search': { $exists: true, $ne: null },
          'actions.timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$actions.search',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Get filter usage
    const filterUsage = await Traffic.aggregate([
      {
        $match: {
          last_visit: { $gte: startDate }
        }
      },
      { $unwind: '$actions' },
      {
        $match: {
          'actions.action': 'filter',
          'actions.filter': { $exists: true, $ne: null },
          'actions.timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            filter: '$actions.filter',
            value: '$actions.value'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      period,
      totalVisits: totalVisits[0]?.totalVisits || 0,
      uniqueVisitors,
      pageViews,
      actionsByType,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      locationBreakdown,
      hourlyTraffic,
      searchTerms,
      filterUsage
    });

  } catch (error) {
    console.error('Error fetching traffic analytics:', error);
    res.status(500).json({ error: 'Failed to fetch traffic analytics' });
  }
});

// Get recent traffic data
router.get('/recent', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const recentTraffic = await Traffic.find()
      .sort({ last_visit: -1 })
      .limit(parseInt(limit))
      .select('ip_address first_visit last_visit total_visits user_agents location actions')
      .lean();

    res.json(recentTraffic);
  } catch (error) {
    console.error('Error fetching recent traffic:', error);
    res.status(500).json({ error: 'Failed to fetch recent traffic' });
  }
});

// Get traffic by IP address
router.get('/ip/:ipAddress', async (req, res) => {
  try {
    const { ipAddress } = req.params;
    
    const ipTraffic = await Traffic.findOne({ ip_address: ipAddress })
      .lean();

    if (!ipTraffic) {
      return res.status(404).json({ error: 'No traffic data found for this IP address' });
    }

    res.json(ipTraffic);
  } catch (error) {
    console.error('Error fetching IP traffic:', error);
    res.status(500).json({ error: 'Failed to fetch IP traffic' });
  }
});

module.exports = router;
