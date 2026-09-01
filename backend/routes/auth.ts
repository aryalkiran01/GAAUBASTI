export {};
  import express from 'express';
const router = express.Router();
import { register, login, getProfile, updateProfile, changePassword, verifyEmail, refreshToken, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { validateUserRegistration, validateUserLogin } from '../middlewares/validation';
import { loginLimiter, passwordLimiter } from '../middlewares/rateLimiters';

// Public routes
router.post('/register', validateUserRegistration, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginLimiter, validateUserLogin, login);
router.post('/forgot-password', passwordLimiter, forgotPassword); 
router.post('/reset-password', passwordLimiter, resetPassword);   

// Protected routes
router.use(authenticate); 
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/refresh-token', refreshToken);

module.exports = router;

