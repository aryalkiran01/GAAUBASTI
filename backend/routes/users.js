const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireOwnershipOrAdmin } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');

// Get user profile by ID (public info only)
router.get('/:id', validateObjectId('id'), async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Protected routes
router.use(authenticate);

// Update user profile
router.put('/:id', validateObjectId('id'), requireOwnershipOrAdmin(), async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'address', 'avatar', 'hostProfile'];
    const updates = {};

    // Filter allowed updates
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;