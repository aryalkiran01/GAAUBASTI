export {};
const mongoose = require('mongoose');
const Payout = require('../models/Payout');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { notifyPayoutCreated } = require('../utils/notifications');

// Host-facing: get own payouts + summary
const getMyPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ host: req.user._id }).sort({ createdAt: -1 });
    const summary = await Payout.aggregate([
      { $match: { host: req.user._id } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'approved']] }, '$amount', 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: { payouts, summary: summary[0] || { totalEarnings: 0, pending: 0 } }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: get all payouts with optional status filter
const getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {} as any;
    if (status) filter.status = status;

    const [payouts, total] = await Promise.all([
      Payout.find(filter)
        .populate('host', 'name email')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payout.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPayouts: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: get eligible host earnings (completed bookings with paid payments, not yet paid out)
const getEligibleEarnings = async (req, res) => {
  try {
    const { hostId } = req.query;

    const matchStage = {
      status: 'completed',
      paymentStatus: 'paid'
    } as any;
    if (hostId) matchStage.host = mongoose.Types.ObjectId.createFromHexString(hostId);

    const earnings = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$host',
          totalEarnings: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 },
          bookingIds: { $push: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'host'
        }
      },
      { $unwind: '$host' },
      {
        $project: {
          hostId: '$_id',
          hostName: '$host.name',
          hostEmail: '$host.email',
          totalEarnings: 1,
          bookingCount: 1,
          bookingIds: 1
        }
      }
    ]);

    // Exclude earnings already covered by existing non-cancelled payouts
    const existingPayouts = await Payout.find({
      status: { $in: ['pending', 'approved', 'paid'] }
    }).select('host bookings');

    const paidOutBookingIds = new Set();
    for (const payout of existingPayouts) {
      for (const bid of payout.bookings) {
        paidOutBookingIds.add(bid.toString());
      }
    }

    const adjusted = earnings.map((entry) => {
      const unpaidBookings = entry.bookingIds.filter(
        (bid) => !paidOutBookingIds.has(bid.toString())
      );
      return {
        ...entry,
        unpaidBookingCount: unpaidBookings.length,
        unpaidBookingIds: unpaidBookings,
        eligibleAmount: unpaidBookings.length > 0
          ? Math.round((entry.totalEarnings / entry.bookingCount) * unpaidBookings.length * 100) / 100
          : 0
      };
    }).filter((entry) => entry.unpaidBookingCount > 0);

    res.json({ success: true, data: { eligibleEarnings: adjusted } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible earnings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: create a payout record for a host
const createPayout = async (req, res) => {
  try {
    const { hostId, amount, period, bookingIds, payoutMethod = 'manual', reference, notes } = req.body;

    if (!hostId || !amount || !period) {
      return res.status(400).json({
        success: false,
        message: 'Host ID, amount, and period are required'
      });
    }

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }

    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    // Check for duplicate payout for same host + period
    const existingPayout = await Payout.findOne({
      host: hostId,
      period,
      status: { $in: ['pending', 'approved', 'paid'] }
    });

    if (existingPayout) {
      return res.status(409).json({
        success: false,
        message: 'A payout already exists for this host and period'
      });
    }

    // Validate booking IDs if provided
    let validatedBookingIds = [];
    let paymentIds = [];

    if (Array.isArray(bookingIds) && bookingIds.length > 0) {
      const bookings = await Booking.find({
        _id: { $in: bookingIds },
        host: hostId,
        status: 'completed',
        paymentStatus: 'paid'
      }).select('_id paymentId');

      validatedBookingIds = bookings.map((b) => b._id);
      paymentIds = bookings
        .map((b) => b.paymentId)
        .filter((id) => id != null);

      // Verify these bookings aren't already in another payout
      const conflictingPayouts = await Payout.find({
        status: { $in: ['pending', 'approved', 'paid'] },
        bookings: { $in: validatedBookingIds }
      });

      if (conflictingPayouts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'One or more bookings are already included in another payout'
        });
      }
    }

    const payout = await Payout.create({
      host: hostId,
      amount: payoutAmount,
      period,
      bookings: validatedBookingIds,
      payments: paymentIds,
      payoutMethod,
      reference,
      notes,
      status: 'pending'
    });

    notifyPayoutCreated({ payout, host }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Payout created successfully. Fund transfer is manual — mark as paid after completing the transfer.',
      data: { payout }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A payout already exists for this host and period'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: approve a payout (transition pending -> approved)
const approvePayout = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot approve payout with status ${payout.status}` });
    }

    payout.status = 'approved';
    payout.approvedBy = req.user._id;
    payout.approvedAt = new Date();
    await payout.save();

    res.json({ success: true, message: 'Payout approved', data: { payout } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: mark payout as paid (transition approved -> paid)
const markPayoutPaid = async (req, res) => {
  try {
    const { reference, notes } = req.body || {};
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    if (payout.status !== 'approved') {
      return res.status(400).json({ success: false, message: `Cannot mark as paid a payout with status ${payout.status}` });
    }

    payout.status = 'paid';
    payout.paidAt = new Date();
    if (reference) payout.reference = reference;
    if (notes) payout.notes = notes;
    await payout.save();

    res.json({ success: true, message: 'Payout marked as paid', data: { payout } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark payout as paid',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: cancel a payout (only if pending or approved)
const cancelPayout = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    if (!['pending', 'approved'].includes(payout.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel payout with status ${payout.status}` });
    }

    payout.status = 'cancelled';
    await payout.save();

    res.json({ success: true, message: 'Payout cancelled', data: { payout } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getMyPayouts,
  getAllPayouts,
  getEligibleEarnings,
  createPayout,
  approvePayout,
  markPayoutPaid,
  cancelPayout
};
