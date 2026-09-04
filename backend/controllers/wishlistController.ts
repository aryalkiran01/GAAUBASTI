export {};
const Wishlist = require('../models/Wishlist');
const Listing = require('../models/Listing');

const toggleWishlist = async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ success: false, message: 'Listing ID is required' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const existing = await Wishlist.findOne({ user: req.user._id, listing: listingId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, message: 'Removed from wishlist', data: { saved: false } });
    }

    const saved = await Wishlist.create({ user: req.user._id, listing: listingId });
    res.status(201).json({ success: true, message: 'Added to wishlist', data: { saved: true, wishlist: saved } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update wishlist', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user._id }).populate('listing').sort({ createdAt: -1 });
    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const removeWishlistItem = async (req, res) => {
  try {
    const { listingId } = req.params;
    const result = await Wishlist.findOneAndDelete({ user: req.user._id, listing: listingId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Wishlist item not found' });
    }

    res.json({ success: true, message: 'Wishlist item removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove wishlist item', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const checkWishlistStatus = async (req, res) => {
  try {
    const { listingIds } = req.body;

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return res.json({ success: true, data: { savedIds: [] } });
    }

    const items = await Wishlist.find({
      user: req.user._id,
      listing: { $in: listingIds }
    }).select('listing');

    const savedIds = items.map((item: any) => item.listing.toString());

    res.json({ success: true, data: { savedIds } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  toggleWishlist,
  getWishlist,
  removeWishlistItem,
  checkWishlistStatus
};
