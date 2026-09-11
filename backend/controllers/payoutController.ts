export {};
const mongoose = require('mongoose');
const Payout = require('../models/Payout');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { notifyPayoutCreated, notifyPayoutPaid } = require('../utils/notifications');

// Host-facing: get own payouts + summary
const getMyPayouts = async (req: any, res: any) => {
  try {
    const payouts = await Payout.find({ host: req.user._id }).sort({ createdAt: -1 });
    const summary = await Payout.aggregate([
      { $match: { host: req.user._id } },
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: {
              $cond: [{ $in: ['$status', ['paid', 'completed']] }, '$amount', 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'processing', 'approved']] }, '$amount', 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: { payouts, summary: summary[0] || { totalEarnings: 0, pending: 0, failed: 0 } }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: get all payouts with optional status filter
const getAllPayouts = async (req: any, res: any) => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: get eligible host earnings (completed bookings with paid payments, not yet paid out)
const getEligibleEarnings = async (req: any, res: any) => {
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
      status: { $in: ['pending', 'processing', 'approved', 'paid', 'completed'] }
    }).select('host bookings');

    const paidOutBookingIds = new Set();
    for (const payout of existingPayouts) {
      for (const bid of payout.bookings) {
        paidOutBookingIds.add(bid.toString());
      }
    }

    const adjusted = earnings.map((entry: any) => {
      const unpaidBookings = entry.bookingIds.filter(
        (bid: any) => !paidOutBookingIds.has(bid.toString())
      );
      return {
        ...entry,
        unpaidBookingCount: unpaidBookings.length,
        unpaidBookingIds: unpaidBookings,
        eligibleAmount: unpaidBookings.length > 0
          ? Math.round((entry.totalEarnings / entry.bookingCount) * unpaidBookings.length * 100) / 100
          : 0
      };
    }).filter((entry: any) => entry.unpaidBookingCount > 0);

    res.json({ success: true, data: { eligibleEarnings: adjusted } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible earnings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin or Host: create a payout record
const createPayout = async (req: any, res: any) => {
  try {
    const {
      hostId: reqHostId,
      amount,
      period,
      bookingIds,
      payoutMethod = 'manual',
      payoutMethodDetails,
      reference,
      notes
    } = req.body;

    const hostId = req.user.role === 'admin' ? reqHostId : req.user._id;

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
      status: { $in: ['pending', 'processing', 'approved', 'paid', 'completed'] }
    });

    if (existingPayout) {
      return res.status(409).json({
        success: false,
        message: 'A payout already exists for this host and period'
      });
    }

    // Validate payout amount against available earnings
    const { getHostEarningsSummary } = require('../services/earningsService');
    const summary = await getHostEarningsSummary(hostId);
    if (payoutAmount > summary.availableEarnings) {
      return res.status(400).json({
        success: false,
        message: `Payout amount ${payoutAmount} exceeds available earnings ${summary.availableEarnings}`
      });
    }

    // Validate booking IDs if provided
    let validatedBookingIds: any[] = [];
    let paymentIds: any[] = [];

    if (Array.isArray(bookingIds) && bookingIds.length > 0) {
      const bookings = await Booking.find({
        _id: { $in: bookingIds },
        host: hostId,
        status: 'completed',
        paymentStatus: 'paid'
      }).select('_id paymentId');

      validatedBookingIds = bookings.map((b: any) => b._id);
      paymentIds = bookings
        .map((b: any) => b.paymentId)
        .filter((id: any) => id != null);

      const conflictingPayouts = await Payout.find({
        status: { $in: ['pending', 'processing', 'approved', 'paid', 'completed'] },
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
      payoutMethodDetails,
      reference,
      notes,
      status: 'pending'
    });

    notifyPayoutCreated({ payout, host }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Payout created successfully. Transfer status tracked under payout history.',
      data: { payout }
    });
  } catch (error: any) {
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
const approvePayout = async (req: any, res: any) => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: mark payout as paid (transition approved/pending/processing -> paid or completed)
const markPayoutPaid = async (req: any, res: any) => {
  try {
    const { reference, notes } = req.body || {};
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    if (!['approved', 'processing', 'pending'].includes(payout.status)) {
      return res.status(400).json({ success: false, message: `Cannot mark as paid a payout with status ${payout.status}` });
    }

    payout.status = 'paid';
    payout.paidAt = new Date();
    payout.completedAt = new Date();
    if (reference) payout.reference = reference;
    if (notes) payout.notes = notes;
    await payout.save();

    const host = await User.findById(payout.host);
    if (host) {
      notifyPayoutPaid({ payout, host }).catch(() => {});
    }

    res.json({ success: true, message: 'Payout marked as paid', data: { payout } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark payout as paid',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: reconcile payout status (completed or failed with reason)
const reconcilePayout = async (req: any, res: any) => {
  try {
    const { status, reference, failureReason, notes } = req.body;
    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    if (!['completed', 'paid', 'failed', 'processing'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reconciliation status. Must be completed, paid, failed, or processing.'
      });
    }

    payout.status = status === 'paid' ? 'completed' : status;
    if (reference) payout.reference = reference;
    if (notes) payout.notes = notes;
    if (failureReason) payout.failureReason = failureReason;

    if (status === 'completed' || status === 'paid') {
      payout.completedAt = new Date();
      payout.paidAt = new Date();
      payout.failureReason = null;

      const host = await User.findById(payout.host);
      if (host) {
        notifyPayoutPaid({ payout, host }).catch(() => {});
      }
    }

    await payout.save();

    res.json({
      success: true,
      message: `Payout reconciled to status: ${payout.status}`,
      data: { payout }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to reconcile payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin or Host: cancel a payout (only if pending or approved)
const cancelPayout = async (req: any, res: any) => {
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
  } catch (error: any) {
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
  reconcilePayout,
  cancelPayout
};
