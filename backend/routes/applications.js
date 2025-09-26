const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');

const router = express.Router();

// Validation middleware
const validateApplication = [
  body('publish_date').optional().isISO8601().withMessage('Valid publish date format required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// GET /api/applications - Get all applications
router.get('/', async (req, res) => {
  try {
    const { featured, support_status, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    if (featured !== undefined) {
      query.is_featured = featured === 'true';
    }
    
    if (support_status) {
      query.support_status_code = support_status;
    }
    
    // Exclude soft-deleted applications by default
    query.deleted_date = null;
    
    const applications = await Application.find(query)
      .select('-embeddings')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ publish_date: -1 });
    
    const total = await Application.countDocuments(query);
    
    res.json({
      data: applications,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + applications.length) < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/:id - Get application by ID
router.get('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).select('-embeddings');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/applications - Create new application
router.post('/', validateApplication, async (req, res) => {
  try {
    const application = new Application(req.body);
    await application.save();
    
    // Remove embeddings from response
    const applicationResponse = application.toObject();
    delete applicationResponse.embeddings;
    
    res.status(201).json({ data: applicationResponse });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Application with this data already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/applications/:id - Update application
router.put('/:id', validateApplication, async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-embeddings');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/applications/:id - Partial update application
router.patch('/:id', async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-embeddings');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/applications/:id - Soft delete application
router.delete('/:id', async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { deleted_date: new Date() },
      { new: true }
    ).select('-embeddings');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully', data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/applications/:id/hard - Hard delete application
router.delete('/:id/hard', async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
