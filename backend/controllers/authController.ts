import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import OTP from '../models/Otp';
import sendEmail from '../utils/sendemail';

const getJwtSecret = (): string => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }

  return 'development-secret-key';
};

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
};

const register = async (req: any, res: any) => {
  try {
    const { name, email, password, role = 'guest', username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

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
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your Gaubasti account',
        text: `Hi ${user.name},\n\nPlease verify your account by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`
      });
    } catch {
      // Email sending is optional in development
    }

    const token = generateToken(user._id.toString());

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

const login = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

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

    const isPasswordValid = await (user as any).comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id.toString());

    user.lastLogin = new Date();
    await user.save();

    user.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user, token }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProfile = async (req: any, res: any) => {
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

const updateProfile = async (req: any, res: any) => {
  try {
    const allowedUpdates = ['name', 'phone', 'address', 'avatar', 'hostProfile'];
    const updates: Record<string, any> = {};

    Object.keys(req.body).forEach((key: string) => {
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

const changePassword = async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await (user as any).comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

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

const forgotPassword = async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

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

const resetPassword = async (req: any, res: any) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date(otpRecord.expires).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

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

const verifyEmail = async (req: any, res: any) => {
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
    (user as any).verificationToken = undefined;
    (user as any).verificationTokenExpires = undefined;
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

const resendVerification = async (req: any, res: any) => {
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

    (user as any).verificationToken = hashedVerificationToken;
    (user as any).verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email/${verificationToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your Gaubasti account',
        text: `Hi ${user.name},\n\nPlease verify your account by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`
      });
    } catch {
      // Email sending is optional in development
    }

    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const refreshToken = async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const token = generateToken(user._id.toString());

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
  resendVerification,
  refreshToken,
  forgotPassword,
  resetPassword
};
