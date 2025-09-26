const express = require('express');
const { body, validationResult } = require('express-validator');
const SupportStatus = require('../models/SupportStatus');

const router = express.Router();

// Validation middleware
const validateSupportStatus = [
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// GET /api/support-status - Get all support statuses
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const supportStatuses = await SupportStatus.find()
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ label: 1 });
    
    const total = await SupportStatus.countDocuments();
    
    res.json({
      data: supportStatuses,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + supportStatuses.length) < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/support-status/:id - Get support status by ID
router.get('/:id', async (req, res) => {
  try {
    const supportStatus = await SupportStatus.findById(req.params.id);
    
    if (!supportStatus) {
      return res.status(404).json({ error: 'Support status not found' });
    }
    
    res.json({ data: supportStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/support-status/code/:code - Get support status by code
router.get('/code/:code', async (req, res) => {
  try {
    const supportStatus = await SupportStatus.findOne({ 
      code: req.params.code.toUpperCase() 
    });
    
    if (!supportStatus) {
      return res.status(404).json({ error: 'Support status not found' });
    }
    
    res.json({ data: supportStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/support-status - Create new support status
router.post('/', validateSupportStatus, async (req, res) => {
  try {
    // Convert code to uppercase
    req.body.code = req.body.code.toUpperCase();
    
    const supportStatus = new SupportStatus(req.body);
    await supportStatus.save();
    
    res.status(201).json({ data: supportStatus });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Support status with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/support-status/:id - Update support status
router.put('/:id', validateSupportStatus, async (req, res) => {
  try {
    // Convert code to uppercase
    req.body.code = req.body.code.toUpperCase();
    
    const supportStatus = await SupportStatus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!supportStatus) {
      return res.status(404).json({ error: 'Support status not found' });
    }
    
    res.json({ data: supportStatus });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Support status with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PATCH /api/support-status/:id - Partial update support status
router.patch('/:id', async (req, res) => {
  try {
    // Convert code to uppercase if provided
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }
    
    const supportStatus = await SupportStatus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!supportStatus) {
      return res.status(404).json({ error: 'Support status not found' });
    }
    
    res.json({ data: supportStatus });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Support status with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE /api/support-status/:id - Delete support status
router.delete('/:id', async (req, res) => {
  try {
    const supportStatus = await SupportStatus.findByIdAndDelete(req.params.id);
    
    if (!supportStatus) {
      return res.status(404).json({ error: 'Support status not found' });
    }
    
    res.json({ message: 'Support status deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
