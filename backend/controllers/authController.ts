export {};
  import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import OTP from '../models/Otp'; 

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }

  return 'development-secret-key';
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: '7d'
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'guest', username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Check if user already exists by email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = new User({
      name,
      email,
      password,
      role,
      username,
      verificationToken: hashedVerificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
    });

    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your Gaubasti account',
      text: `Hi ${user.name},\n\nPlease verify your account by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`
    });

    const token = generateToken(user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email to complete setup.',
      data: { user, token }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('listings', 'title location price averageRating')
      .populate('bookings', 'listing startDate endDate status totalPrice');

    res.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
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
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

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
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

import sendEmail from '../utils/sendemail';


// --- Forgot Password: send OTP ---
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    // Save OTP to separate collection
    await OTP.findOneAndUpdate(
      { email },
      { otp, expires },
      { upsert: true, new: true }
    );

    if (process.env.NODE_ENV === 'development') {
      console.info('OTP generation requested for a user');
    }

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Forgot password error');
    }
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: process.env.NODE_ENV === 'development' && process.env.DEBUG_ERRORS === 'true' ? error.message : undefined
    });
  }
};

// --- Reset Password: verify OTP ---
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check OTP from separate collection
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (otpRecord.expires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ email });

    if (process.env.NODE_ENV === 'development') {
      console.info('Password reset completed');
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Password reset error');
    }
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' && process.env.DEBUG_ERRORS === 'true' ? error.message : undefined
    });
  }
};


// Refresh token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or expired'
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: { token }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  refreshToken,
  forgotPassword,
  resetPassword
};
