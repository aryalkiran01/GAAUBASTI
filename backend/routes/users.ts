const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireOwnershipOrAdmin } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');

// Get current user's notification preferences
router.get('/notification-preferences', authenticate, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const defaultPrefs = {
      email: {
        bookings: true,
        payments: true,
        messages: true,
        reviews: true,
        hostEvents: true,
        marketing: false
      },
      sms: {
        bookings: true,
        payments: true,
        security: true,
        messages: false
      },
      inApp: {
        bookings: true,
        payments: true,
        messages: true,
        reviews: true,
        hostEvents: true
      }
    };

    const preferences = user.notificationPreferences
      ? {
          email: { ...defaultPrefs.email, ...(user.notificationPreferences.email?.toObject ? user.notificationPreferences.email.toObject() : user.notificationPreferences.email || {}) },
          sms: { ...defaultPrefs.sms, ...(user.notificationPreferences.sms?.toObject ? user.notificationPreferences.sms.toObject() : user.notificationPreferences.sms || {}) },
          inApp: { ...defaultPrefs.inApp, ...(user.notificationPreferences.inApp?.toObject ? user.notificationPreferences.inApp.toObject() : user.notificationPreferences.inApp || {}) }
        }
      : defaultPrefs;

    res.json({
      success: true,
      data: { notificationPreferences: preferences }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update current user's notification preferences
router.patch('/notification-preferences', authenticate, async (req: any, res: any) => {
  try {
    const { email, sms, inApp } = req.body || {};

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const current = user.notificationPreferences || {};
    const updatedEmail = {
      ...(current.email?.toObject ? current.email.toObject() : current.email || {}),
      ...(email || {})
    };
    const updatedSms = {
      ...(current.sms?.toObject ? current.sms.toObject() : current.sms || {}),
      ...(sms || {})
    };
    const updatedInApp = {
      ...(current.inApp?.toObject ? current.inApp.toObject() : current.inApp || {}),
      ...(inApp || {})
    };

    // Critical security and payment notification guardrails:
    // Security & payment alerts are mandatory on at least in-app or primary channel to ensure account safety
    updatedEmail.payments = true; // Critical payment confirmations always sent
    updatedSms.security = true;   // Security alerts cannot be disabled
    updatedInApp.payments = true; // In-app ledger integrity

    user.notificationPreferences = {
      email: updatedEmail,
      sms: updatedSms,
      inApp: updatedInApp
    };

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { notificationPreferences: user.notificationPreferences }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user profile by ID (public info only)
router.get('/:id', validateObjectId('id'), async (req: any, res: any) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar role hostProfile.bio hostProfile.languages hostProfile.responseRate hostProfile.joinedDate')
      .populate('listings', 'title location price averageRating reviewCount images');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user profile
router.put('/:id', authenticate, validateObjectId('id'), requireOwnershipOrAdmin('user'), async (req: any, res: any) => {
  try {
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const allowedUpdates = ['name', 'phone', 'address', 'avatar', 'hostProfile'];
    const updates: Record<string, any> = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
