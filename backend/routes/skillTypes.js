const express = require('express');
const { body, validationResult } = require('express-validator');
const SkillType = require('../models/SkillType');

const router = express.Router();

// Validation middleware
const validateSkillType = [
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// GET /api/skill-types - Get all skill types
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const skillTypes = await SkillType.find()
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ label: 1 });
    
    const total = await SkillType.countDocuments();
    
    res.json({
      data: skillTypes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + skillTypes.length) < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/skill-types/:id - Get skill type by ID
router.get('/:id', async (req, res) => {
  try {
    const skillType = await SkillType.findById(req.params.id);
    
    if (!skillType) {
      return res.status(404).json({ error: 'Skill type not found' });
    }
    
    res.json({ data: skillType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/skill-types/code/:code - Get skill type by code
router.get('/code/:code', async (req, res) => {
  try {
    const skillType = await SkillType.findOne({ code: req.params.code.toUpperCase() });
    
    if (!skillType) {
      return res.status(404).json({ error: 'Skill type not found' });
    }
    
    res.json({ data: skillType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/skill-types - Create new skill type
router.post('/', validateSkillType, async (req, res) => {
  try {
    // Convert code to uppercase
    req.body.code = req.body.code.toUpperCase();
    
    const skillType = new SkillType(req.body);
    await skillType.save();
    
    res.status(201).json({ data: skillType });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Skill type with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/skill-types/:id - Update skill type
router.put('/:id', validateSkillType, async (req, res) => {
  try {
    // Convert code to uppercase
    req.body.code = req.body.code.toUpperCase();
    
    const skillType = await SkillType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!skillType) {
      return res.status(404).json({ error: 'Skill type not found' });
    }
    
    res.json({ data: skillType });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Skill type with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PATCH /api/skill-types/:id - Partial update skill type
router.patch('/:id', async (req, res) => {
  try {
    // Convert code to uppercase if provided
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }
    
    const skillType = await SkillType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!skillType) {
      return res.status(404).json({ error: 'Skill type not found' });
    }
    
    res.json({ data: skillType });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Skill type with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE /api/skill-types/:id - Delete skill type
router.delete('/:id', async (req, res) => {
  try {
    const skillType = await SkillType.findByIdAndDelete(req.params.id);
    
    if (!skillType) {
      return res.status(404).json({ error: 'Skill type not found' });
    }
    
    res.json({ message: 'Skill type deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
