const express = require('express');
const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');

const router = express.Router();

// Validation middleware
const validateSkill = [
  body('is_proficient').optional().isBoolean().withMessage('is_proficient must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// GET /api/skills - Get all skills
router.get('/', async (req, res) => {
  try {
    const { 
      proficient, 
      skill_type, 
      visible, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = {};
    
    if (proficient !== undefined) {
      query.is_proficient = proficient === 'true';
    }
    
    if (skill_type) {
      query.skill_type_code = skill_type.toUpperCase();
    }
    
    if (visible !== undefined) {
      query.is_visible_in_app_details = visible === 'true';
    }
    
    const skills = await Skill.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ name: 1 });
    
    const total = await Skill.countDocuments(query);
    
    res.json({
      data: skills,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + skills.length) < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/skills/:id - Get skill by ID
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ data: skill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/skills/code/:code - Get skill by code
router.get('/code/:code', async (req, res) => {
  try {
    const skill = await Skill.findOne({ code: req.params.code.toUpperCase() });
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ data: skill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/skills/type/:skillTypeCode - Get skills by skill type
router.get('/type/:skillTypeCode', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const skills = await Skill.find({ 
      skill_type_code: req.params.skillTypeCode.toUpperCase() 
    })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ name: 1 });
    
    const total = await Skill.countDocuments({ 
      skill_type_code: req.params.skillTypeCode.toUpperCase() 
    });
    
    res.json({
      data: skills,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + skills.length) < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/skills - Create new skill
router.post('/', validateSkill, async (req, res) => {
  try {
    // Convert codes to uppercase
    req.body.code = req.body.code.toUpperCase();
    req.body.skill_type_code = req.body.skill_type_code.toUpperCase();
    
    const skill = new Skill(req.body);
    await skill.save();
    
    res.status(201).json({ data: skill });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Skill with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/skills/:id - Update skill
router.put('/:id', validateSkill, async (req, res) => {
  try {
    // Convert codes to uppercase
    req.body.code = req.body.code.toUpperCase();
    req.body.skill_type_code = req.body.skill_type_code.toUpperCase();
    
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ data: skill });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Skill with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PATCH /api/skills/:id - Partial update skill
router.patch('/:id', async (req, res) => {
  try {
    // Convert codes to uppercase if provided
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }
    if (req.body.skill_type_code) {
      req.body.skill_type_code = req.body.skill_type_code.toUpperCase();
    }
    
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ data: skill });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Skill with this code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE /api/skills/:id - Delete skill
router.delete('/:id', async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
