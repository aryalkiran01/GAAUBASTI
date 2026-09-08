export {};
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const { getHostEarningsSummary, getHostEarningsBreakdown } = require('../services/earningsService');

const getHostAnalytics = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { period = '30d' } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(endDate.getDate() - 7); break;
      case '30d': startDate.setDate(endDate.getDate() - 30); break;
      case '90d': startDate.setDate(endDate.getDate() - 90); break;
      case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
      default: startDate.setDate(endDate.getDate() - 30);
    }

    const [earnings, bookingTrends, occupancy, listingPerformance, reviewStats] = await Promise.all([
      getHostEarningsSummary(hostId),
      Booking.aggregate([
        { $match: { host: hostId, createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            bookings: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      (async () => {
        const listings = await Listing.find({ host: hostId }).select('_id');
        const listingIds = listings.map((l: any) => l._id);
        if (listingIds.length === 0) return { occupancyRate: 0, totalNights: 0, totalAvailableNights: 0 };

        const totalNights = await BookingNight.countDocuments({
          listing: { $in: listingIds },
          date: { $gte: startDate, $lte: endDate },
        });

        const daysInPeriod = Math.ceil((Number(endDate) - Number(startDate)) / (1000 * 60 * 60 * 24));
        const totalAvailableNights = listingIds.length * daysInPeriod;
        const occupancyRate = totalAvailableNights > 0 ? Math.round((totalNights / totalAvailableNights) * 100) : 0;

        return { occupancyRate, totalNights, totalAvailableNights };
      })(),
      Listing.aggregate([
        { $match: { host: hostId, isActive: true } },
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'listing',
            as: 'bookings',
          },
        },
        {
          $project: {
            title: 1,
            price: 1,
            averageRating: 1,
            reviewCount: 1,
            totalBookings: { $size: '$bookings' },
            totalRevenue: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$bookings',
                      cond: { $eq: ['$$this.status', 'completed'] },
                    },
                  },
                  as: 'b',
                  in: '$$b.totalPrice',
                },
              },
            },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),
      Review.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $lookup: {
            from: 'listings',
            localField: 'listing',
            foreignField: '_id',
            as: 'listing',
          },
        },
        { $unwind: '$listing' },
        { $match: { 'listing.host': hostId } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        period,
        earnings,
        bookingTrends,
        occupancy,
        listingPerformance,
        reviewStats: reviewStats[0] || { avgRating: 0, reviewCount: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch host analytics', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getHostEarnings = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const summary = await getHostEarningsSummary(hostId);
    const breakdown = await getHostEarningsBreakdown(hostId, parseInt(page), parseInt(limit));
    res.json({ success: true, data: { summary, breakdown } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch host earnings', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const BookingNight = require('../models/BookingNight');

module.exports = {
  getHostAnalytics,
  getHostEarnings,
};
