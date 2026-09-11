export {};
const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    maxlength: [100, 'Village name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Village slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  province: {
    type: String,
    required: [true, 'Province is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  municipality: {
    type: String,
    trim: true
  },
  altitude: {
    type: Number, // in meters
    default: null
  },
  tagline: {
    type: String,
    trim: true,
    maxlength: [200, 'Tagline cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  heroImage: {
    type: String,
    required: [true, 'Hero image is required']
  },
  gallery: [{
    type: String
  }],
  culture: {
    overview: { type: String, default: '' },
    ethnicGroups: [{ type: String }],
    traditions: [{ type: String }],
    languages: [{ type: String }]
  },
  localFood: [{
    name: { type: String, required: true },
    description: String,
    image: String
  }],
  festivals: [{
    name: { type: String, required: true },
    month: String,
    description: String
  }],
  attractions: [{
    title: { type: String },
    name: { type: String },
    description: String,
    distance: String,
    image: String
  }],
  activities: [{
    title: { type: String, required: true },
    description: String,
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging'],
      default: 'Easy'
    }
  }],
  transport: {
    howToReach: String,
    nearestBusStop: String,
    nearestAirport: String,
    roadCondition: String,
    estimatedTravelTime: String
  },
  bestTimeToVisit: [{
    type: String
  }],
  safetyInfo: {
    medicalFacilities: String,
    networkConnectivity: String,
    emergencyContacts: [{ type: String }],
    generalTips: [{ type: String }]
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  seoTitle: String,
  seoDescription: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
villageSchema.index({ slug: 1 });
villageSchema.index({ province: 1 });
villageSchema.index({ district: 1 });
villageSchema.index({ isFeatured: 1 });
villageSchema.index({ coordinates: '2dsphere' });

// Virtual to populate related listings
villageSchema.virtual('listings', {
  ref: 'Listing',
  localField: 'name',
  foreignField: 'location.village'
});

module.exports = mongoose.model('Village', villageSchema);
