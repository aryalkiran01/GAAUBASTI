export {};
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  refreshToken,

  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const {
  validateUserRegistration,
  validateUserLogin
} = require('../middlewares/validation');
const { loginLimiter, passwordLimiter } = require('../middlewares/rateLimiters');

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

