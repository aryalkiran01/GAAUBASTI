export {};
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/Otp'); 

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }

  throw new Error('JWT_SECRET environment variable is required');
};

const RevokedToken = require('../models/RevokedToken');

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching JWT expiry
  };
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
    const { name, email, password, username } = req.body;
    const role = req.body.role === 'host' ? 'host' : 'guest';

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
    const verifyTemplate = emailTemplates.email_verification({ name: user.name, verifyUrl });
    sendEmail({
      to: user.email,
      subject: verifyTemplate.subject,
      text: verifyTemplate.text,
      html: verifyTemplate.html
    }).catch(() => {});

    const token = generateToken(user._id);

    user.lastLogin = new Date();
    await user.save();

    // Set httpOnly cookie for secure auth
    res.cookie('token', token, getCookieOptions());

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

    // Find user and include password and lockout fields for comparison
    const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');
    
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

    // Account lockout check (protection against credential stuffing / targeted brute force)
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.max(1, Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000)));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lockout
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.'
        });
      }
      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    user.password = undefined;

    // Set httpOnly cookie for secure auth
    res.cookie('token', token, getCookieOptions());

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

const sendEmail = require('../utils/sendemail');
const emailTemplates = require('../utils/emailTemplates');
const { sendOTPSMS } = require('../utils/sendSMS');


// --- Forgot Password: send OTP ---
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account with that email exists, an OTP has been sent.' });
    }

    // Generate 6-digit OTP using cryptographically secure RNG
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    // Hash OTP before storing
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Save hashed OTP to separate collection
    await OTP.findOneAndUpdate(
      { email },
      { otp: hashedOtp, expires },
      { upsert: true, new: true }
    );

    if (process.env.NODE_ENV === 'development') {
      console.info('OTP generation requested for a user');
    }

    const otpTemplate = emailTemplates.otp({ otp });
    sendEmail({
      to: user.email,
      subject: otpTemplate.subject,
      text: otpTemplate.text,
      html: otpTemplate.html
    }).catch(() => {});

    if (user.phone) {
      sendOTPSMS(user.phone, otp).catch(() => {});
    }

    res.json({ success: true, message: 'If an account with that email exists, an OTP has been sent.' });
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

    // Hash the submitted OTP and compare
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const otpRecord = await OTP.findOne({ email, otp: hashedOtp });

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

// Logout - blacklist the current token with persistent DB storage + memory cache
const memoryBlacklist = new Set<string>();

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const addToBlacklist = async (token: string) => {
  if (!token) return;
  memoryBlacklist.add(token);
  try {
    const mongooseInstance = require('mongoose');
    if (mongooseInstance.connection?.readyState === 1) {
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await RevokedToken.findOneAndUpdate(
        { tokenHash },
        { tokenHash, expiresAt, revokedAt: new Date() },
        { upsert: true, new: true }
      );
    }
  } catch (err: any) {
    console.error('Failed to save revoked token to database:', err.message);
  }
};

const isBlacklisted = async (token: string): Promise<boolean> => {
  if (!token) return false;
  if (memoryBlacklist.has(token)) return true;
  try {
    const mongooseInstance = require('mongoose');
    if (mongooseInstance.connection?.readyState === 1) {
      const tokenHash = hashToken(token);
      const found = await RevokedToken.findOne({ tokenHash });
      if (found) {
        memoryBlacklist.add(token);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      await addToBlacklist(token);
    }

    // Clear authentication cookie
    const { maxAge: _maxAge, ...clearOptions } = getCookieOptions();
    res.clearCookie('token', clearOptions);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resend email verification
const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    user.verificationToken = hashedVerificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email/${verificationToken}`;
    const verifyTemplate = emailTemplates.email_verification({ name: user.name, verifyUrl });
    sendEmail({
      to: user.email,
      subject: verifyTemplate.subject,
      text: verifyTemplate.text,
      html: verifyTemplate.html
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete account (soft delete - deactivate)
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Deactivate instead of hard delete to preserve referential integrity
    user.isActive = false;
    await user.save();

    // Blacklist current token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      addToBlacklist(token);
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Apply to become a host
const applyForHost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'host' || user.hostStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'You are already a host'
      });
    }

    if (user.hostStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Your host application is already pending review'
      });
    }

    const { bio, languages } = req.body;

    user.hostStatus = 'pending';
    user.hostAppliedAt = new Date();
    if (bio) user.hostProfile = { ...user.hostProfile, bio };
    if (languages) user.hostProfile = { ...user.hostProfile, languages };
    await user.save();

    res.json({
      success: true,
      message: 'Host application submitted. An admin will review your request.',
      data: { user }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit host application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  resendVerification,
  deleteAccount,
  applyForHost,
  isBlacklisted,
  addToBlacklist
};
