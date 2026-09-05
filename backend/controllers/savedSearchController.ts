import SavedSearch from '../models/SavedSearch';
import { Response } from 'express';

const ALLOWED_FILTER_KEYS = [
  'location', 'minPrice', 'maxPrice', 'guests', 'rating',
  'category', 'amenities', 'sortBy', 'sortOrder'
];

const sanitizeFilters = (raw: any = {}) => {
  const filters: any = {};
  for (const key of ALLOWED_FILTER_KEYS) {
    if (Object.prototype.hasOwnProperty.call(raw, key) && raw[key] !== undefined && raw[key] !== null && raw[key] !== '') {
      filters[key] = raw[key];
    }
  }
  return filters;
};

export const getSavedSearches = async (req: any, res: Response) => {
  try {
    const searches = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { searches } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved searches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const createSavedSearch = async (req: any, res: Response) => {
  try {
    const { name, filters, notifyOnMatch } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const sanitized = sanitizeFilters(filters);
    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({ success: false, message: 'At least one filter is required' });
    }

    const search = await SavedSearch.create({
      user: req.user._id,
      name: String(name).trim().slice(0, 100),
      filters: sanitized,
      notifyOnMatch: Boolean(notifyOnMatch)
    });

    res.status(201).json({ success: true, message: 'Saved search created', data: { search } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create saved search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteSavedSearch = async (req: any, res: Response) => {
  try {
    const result = await SavedSearch.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Saved search not found' });
    }

    res.json({ success: true, message: 'Saved search deleted' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete saved search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
