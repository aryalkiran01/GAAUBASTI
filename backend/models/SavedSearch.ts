import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  filters: {
    location: { type: String, trim: true },
    minPrice: { type: Number, min: 0 },
    maxPrice: { type: Number, min: 0 },
    guests: { type: Number, min: 1 },
    rating: { type: Number, min: 0, max: 5 },
    category: { type: String, trim: true },
    amenities: [{ type: String, trim: true }],
    sortBy: { type: String, default: 'createdAt' },
    sortOrder: { type: String, enum: ['asc', 'desc'], default: 'desc' }
  },
  notifyOnMatch: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

savedSearchSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('SavedSearch', savedSearchSchema);
