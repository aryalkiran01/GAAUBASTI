import express from 'express';
import { register, login, getProfile, updateProfile, changePassword, verifyEmail, refreshToken, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateUserRegistration, validateUserLogin } from '../middlewares/validation.js';
import { loginLimiter, passwordLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

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

export default router;