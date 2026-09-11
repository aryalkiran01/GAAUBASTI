const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    default: 'general'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  author: {
    name: { type: String, default: 'Gaun Basti Editorial' },
    avatar: { type: String },
    role: { type: String, default: 'Cultural Specialist' }
  },
  tags: [{
    type: String,
    trim: true
  }],
  villageSlug: {
    type: String,
    trim: true,
    lowercase: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  readingTime: {
    type: String,
    default: '5 min read'
  },
  published: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

articleSchema.index({ slug: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ isFeatured: 1 });
articleSchema.index({ villageSlug: 1 });

export = mongoose.model('Article', articleSchema);
