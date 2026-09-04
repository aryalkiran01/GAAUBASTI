import Dispute from '../models/Dispute.js';
import Booking from '../models/Booking.js';
import { logAdminAction } from '../middlewares/auditLogger.js';

const createDispute = async (req, res) => {
  try {
    const { booking: bookingId, subject, description, category } = req.body;

    if (!bookingId || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, subject, and description are required',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isGuest = booking.guest.toString() === req.user._id.toString();
    const isHost = booking.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isGuest && !isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only raise disputes for your own bookings' });
    }

    const existing = await Dispute.findOne({ booking: bookingId, raisedBy: req.user._id, status: { $in: ['open', 'under_review'] } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have an open dispute for this booking' });
    }

    const dispute = await Dispute.create({
      booking: bookingId,
      raisedBy: req.user._id,
      subject,
      description,
      category: category || 'other',
      status: 'open',
    });

    await dispute.populate('booking', 'listing startDate endDate status');
    await dispute.populate('raisedBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: { dispute },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create dispute',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getMyDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { raisedBy: req.user._id };
    if (status) filter.status = status;

    const [disputes, total] = await Promise.all([
      Dispute.find(filter)
        .populate('booking', 'listing startDate endDate status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Dispute.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        disputes,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalDisputes: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('booking', 'listing startDate endDate status')
      .populate('raisedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('responses.author', 'name email role');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    const isOwner = dispute.raisedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: { dispute } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dispute',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const addDisputeResponse = async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Response body is required' });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    const isOwner = dispute.raisedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (['resolved', 'dismissed'].includes(dispute.status)) {
      return res.status(400).json({ success: false, message: 'Cannot respond to a resolved or dismissed dispute' });
    }

    dispute.responses.push({
      author: req.user._id,
      body: body.trim(),
      isStaff: isAdmin,
    });

    if (isAdmin && dispute.status === 'open') {
      dispute.status = 'under_review';
    }

    await dispute.save();
    await dispute.populate('responses.author', 'name email role');

    return res.json({ success: true, message: 'Response added', data: { dispute } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getAllDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;

    const [disputes, total] = await Promise.all([
      Dispute.find(filter)
        .populate('booking', 'listing startDate endDate status')
        .populate('raisedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Dispute.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        disputes,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalDisputes: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { status, resolution } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be resolved or dismissed' });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    const before = { status: dispute.status };
    dispute.status = status;
    dispute.resolution = resolution || '';
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();

    await dispute.save();
    await logAdminAction({
      actor: req.user._id,
      action: `dispute_${status}`,
      targetType: 'Dispute',
      targetId: dispute._id,
      before,
      after: { status: dispute.status, resolution: dispute.resolution },
    });

    return res.json({ success: true, message: 'Dispute resolved', data: { dispute } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve dispute',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export { createDispute, getMyDisputes, getDispute, addDisputeResponse, getAllDisputes, resolveDispute };
