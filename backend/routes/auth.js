const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const {
  validateUserRegistration,
  validateUserLogin
} = require('../middlewares/validation');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/refresh-token', refreshToken);

module.exports = router;