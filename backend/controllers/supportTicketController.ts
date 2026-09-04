import SupportTicket from '../models/SupportTicket.js';
import Booking from '../models/Booking.js';
import { logAdminAction } from '../middlewares/auditLogger.js';

const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority, relatedBooking, relatedListing } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required',
      });
    }

    if (relatedBooking) {
      const booking = await Booking.findById(relatedBooking);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Related booking not found' });
      }
      const isGuest = booking.guest.toString() === req.user._id.toString();
      const isHost = booking.host.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isGuest && !isHost && !isAdmin) {
        return res.status(403).json({ success: false, message: 'You can only create tickets for your own bookings' });
      }
    }

    const ticket = await SupportTicket.create({
      requester: req.user._id,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'normal',
      relatedBooking: relatedBooking || null,
      relatedListing: relatedListing || null,
      status: 'open',
    });

    await ticket.populate('requester', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { requester: req.user._id };
    if (status) filter.status = status;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('relatedBooking', 'listing startDate endDate')
        .populate('relatedListing', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalTickets: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('requester', 'name email')
      .populate('relatedBooking', 'listing startDate endDate')
      .populate('relatedListing', 'title')
      .populate('assignedTo', 'name email')
      .populate('responses.author', 'name email role');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isOwner = ticket.requester._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: { ticket } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const addTicketResponse = async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Response body is required' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isOwner = ticket.requester.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({ success: false, message: 'Cannot respond to a resolved or closed ticket' });
    }

    ticket.responses.push({
      author: req.user._id,
      body: body.trim(),
      isStaff: isAdmin,
    });

    if (isAdmin && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();
    await ticket.populate('responses.author', 'name email role');

    return res.json({ success: true, message: 'Response added', data: { ticket } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('requester', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalTickets: total,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { status, assignTo } = req.body;
    const allowed = ['open', 'in_progress', 'resolved', 'closed'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const before = { status: ticket.status, assignedTo: ticket.assignedTo };
    ticket.status = status;
    if (assignTo) ticket.assignedTo = assignTo;
    if (['resolved', 'closed'].includes(status)) {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = req.user._id;
    }

    await ticket.save();
    await logAdminAction({
      actor: req.user._id,
      action: `ticket_${status}`,
      targetType: 'SupportTicket',
      targetId: ticket._id,
      before,
      after: { status: ticket.status, assignedTo: ticket.assignedTo },
    });

    return res.json({ success: true, message: 'Ticket updated', data: { ticket } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export { createTicket, getMyTickets, getTicket, addTicketResponse, getAllTickets, updateTicketStatus };
