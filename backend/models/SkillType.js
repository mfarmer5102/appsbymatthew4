const mongoose = require('mongoose');

const skillTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  label: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
skillTypeSchema.index({ code: 1 });

module.exports = mongoose.model('SkillType', skillTypeSchema, 'skill_types');
