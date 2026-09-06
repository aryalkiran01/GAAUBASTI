export {};
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const getRecommendedListings = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { limit = 8 } = req.query;
    const maxResults = Math.min(parseInt(limit), 20);

    let recommended: any[] = [];

    if (userId) {
      const userBookings = await Booking.find({ guest: userId })
        .populate('listing', 'category location.city')
        .select('listing')
        .limit(20);

      const bookedCategories = [...new Set(
        userBookings
          .map((b: any) => b.listing?.category)
          .filter(Boolean)
      )];
      const bookedCities = [...new Set(
        userBookings
          .map((b: any) => b.listing?.location?.city)
          .filter(Boolean)
      )];

      if (bookedCategories.length > 0 || bookedCities.length > 0) {
        const filter: any = { isActive: true, isVerified: true };
        if (bookedCategories.length > 0) filter.category = { $in: bookedCategories };
        if (bookedCities.length > 0) filter['location.city'] = { $in: bookedCities };

        const bookedListingIds = userBookings.map((b: any) => b.listing?._id).filter(Boolean);
        if (bookedListingIds.length > 0) filter._id = { $nin: bookedListingIds };

        recommended = await Listing.find(filter)
          .populate('host', 'name avatar')
          .sort({ averageRating: -1, totalBookings: -1 })
          .limit(maxResults);
      }
    }

    if (recommended.length < maxResults) {
      const existingIds = recommended.map((l: any) => l._id);
      const fallback = await Listing.find({
        isActive: true,
        isVerified: true,
        ...(existingIds.length > 0 ? { _id: { $nin: existingIds } } : {}),
      })
        .populate('host', 'name avatar')
        .sort({ averageRating: -1, totalBookings: -1 })
        .limit(maxResults - recommended.length);
      recommended = [...recommended, ...fallback];
    }

    res.json({ success: true, data: { listings: recommended } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getSimilarListings = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { limit = 4 } = req.query;
    const maxResults = Math.min(parseInt(limit), 10);

    const listing = await Listing.findById(listingId).select('category location.city price maxGuests');
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const similar = await Listing.find({
      _id: { $ne: listingId },
      isActive: true,
      isVerified: true,
      $or: [
        { category: listing.category },
        { 'location.city': listing.location?.city },
      ],
    })
      .populate('host', 'name avatar')
      .sort({ averageRating: -1 })
      .limit(maxResults);

    res.json({ success: true, data: { listings: similar } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch similar listings', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getRecentlyViewed = async (req, res) => {
  try {
    const recentlyViewed = (req.cookies?.recently_viewed || '')
      .split(',')
      .filter(Boolean)
      .slice(0, 8);

    if (recentlyViewed.length === 0) {
      return res.json({ success: true, data: { listings: [] } });
    }

    const listings = await Listing.find({
      _id: { $in: recentlyViewed },
      isActive: true,
    })
      .populate('host', 'name avatar')
      .select('title price images location averageRating reviewCount category');

    const ordered = recentlyViewed
      .map((id: string) => listings.find((l: any) => l._id.toString() === id))
      .filter(Boolean);

    res.json({ success: true, data: { listings: ordered } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recently viewed', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const trackRecentlyViewed = async (req, res) => {
  try {
    const { listingId } = req.params;
    const existing = (req.cookies?.recently_viewed || '').split(',').filter(Boolean);
    const filtered = existing.filter((id: string) => id !== listingId);
    filtered.unshift(listingId);
    const updated = filtered.slice(0, 10).join(',');

    res.cookie('recently_viewed', updated, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
    });

    res.json({ success: true, message: 'Recently viewed updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to track view', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  getRecommendedListings,
  getSimilarListings,
  getRecentlyViewed,
  trackRecentlyViewed,
};
