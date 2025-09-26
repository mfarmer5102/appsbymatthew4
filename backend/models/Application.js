const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  publish_date: {
    type: Date
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  },
  deployed_link: {
    type: String,
    trim: true
  },
  repositories: [{
    type: String,
    trim: true
  }],
  support_status_code: {
    type: String,
    trim: true
  },
  associated_skill_codes: [{
    type: String,
    trim: true
  }],
  embeddings: [{
    type: Number
  }],
  image_url_relative: {
    type: String,
    trim: true
  },
  deleted_date: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
applicationSchema.index({ title: 1 });
applicationSchema.index({ support_status_code: 1 });
applicationSchema.index({ is_featured: 1 });
applicationSchema.index({ deleted_date: 1 });

module.exports = mongoose.model('Application', applicationSchema);
