const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  is_proficient: {
    type: Boolean
  },
  name: {
    type: String,
    trim: true
  },
  skill_type_code: {
    type: String,
    trim: true,
    uppercase: true
  },
  code: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  is_visible_in_app_details: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
skillSchema.index({ code: 1 });
skillSchema.index({ skill_type_code: 1 });
skillSchema.index({ is_proficient: 1 });
skillSchema.index({ is_visible_in_app_details: 1 });

module.exports = mongoose.model('Skill', skillSchema, 'skills');
