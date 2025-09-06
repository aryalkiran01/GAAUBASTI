const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isAlphanumeric()
    .withMessage('Username must be alphanumeric'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('role')
    .optional()
    .isIn(['guest', 'host', 'admin'])
    .withMessage('Role must be either guest, host, or admin'),

  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Listing validation rules
const validateListing = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),

  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),

  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('maxGuests')
    .isInt({ min: 1 })
    .withMessage('Maximum guests must be at least 1'),

  body('bedrooms')
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a non-negative number'),

  body('bathrooms')
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a non-negative number'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),

  handleValidationErrors
];

// Booking validation rules
const validateBooking = [
  body('listing')
    .isMongoId()
    .withMessage('Valid listing ID is required'),

  body('startDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid start date is required'),

  body('endDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid end date is required'),

  body('guests.adults')
    .isInt({ min: 1 })
    .withMessage('At least 1 adult guest is required'),

  body('guests.children')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Children count must be non-negative'),

  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number'),

  handleValidationErrors
];

// Review validation rules
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),

  body('ratings.cleanliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Cleanliness rating must be between 1 and 5'),

  body('ratings.communication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),

  body('ratings.checkIn')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Check-in rating must be between 1 and 5'),

  body('ratings.accuracy')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Accuracy rating must be between 1 and 5'),

  body('ratings.location')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Location rating must be between 1 and 5'),

  body('ratings.value')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Value rating must be between 1 and 5'),

  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Query validation for listings
const validateListingQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be non-negative'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be non-negative'),

  query('guests')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Guests must be at least 1'),

  query('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),

  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateListing,
  validateBooking,
  validateReview,
  validateObjectId,
  validateListingQuery
};
