const mongoose = require('mongoose');

const supportStatusSchema = new mongoose.Schema({
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
supportStatusSchema.index({ code: 1 });

module.exports = mongoose.model('SupportStatus', supportStatusSchema, 'support_statuses');
