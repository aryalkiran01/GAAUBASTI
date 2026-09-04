import express from 'express';
const router = express.Router();
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  refreshToken,

  forgotPassword,
  resetPassword,
  resendVerification
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import {
  validateUserRegistration,
  validateUserLogin
} from '../middlewares/validation.js';
import { loginLimiter, passwordLimiter, resendVerificationLimiter } from '../middlewares/rateLimiters.js';

// Public routes
router.post('/register', validateUserRegistration, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginLimiter, validateUserLogin, login);
router.post('/forgot-password', passwordLimiter, forgotPassword); 
router.post('/reset-password', passwordLimiter, resetPassword);
router.post('/resend-verification', resendVerificationLimiter, resendVerification);   

// Protected routes
router.use(authenticate); 
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/refresh-token', refreshToken);

export default router;

