export {};
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes and middleware
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const listingRoutes = require('./routes/listings');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

const getRequiredEnvVars = () => {
  const required = ['JWT_SECRET'];
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    required.push('MONGODB_URI');
  }
  const paymentProvider = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  if (paymentProvider === 'stripe') {
    required.push('STRIPE_SECRET_KEY');
  }
  return required;
};

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable in production: JWT_SECRET');
  }

  return 'development-secret-key';
};

const requiredEnvVars = getRequiredEnvVars();
const missingRequiredEnvVars = requiredEnvVars.filter((key) => {
  return process.env.NODE_ENV === 'production' && !process.env[key];
});

if (missingRequiredEnvVars.length > 0) {
  throw new Error(`Missing required environment variables in production: ${missingRequiredEnvVars.join(', ')}`);
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/gaunbasti';
const jwtSecret = getJwtSecret();

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('JWT_SECRET not set. Using a temporary development secret for local testing.');
}

// Configure CORS
const allowedOrigins = [
  'http://localhost:8080',
  'https://gaaubasti-19rzg9sr5-aryalkiran01s-projects.vercel.app',
  'https://gaaubasti.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply middleware in correct order
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Gaunbasti API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
let server;

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);
    if (process.env.NODE_ENV !== 'test') {
      console.log('Connected to MongoDB');
    }

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('Failed to start server');
    process.exitCode = 1;
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

process.on('SIGINT', async () => {
  if (server) {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  } else {
    await mongoose.disconnect();
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  if (server) {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  } else {
    await mongoose.disconnect();
    process.exit(0);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Unhandled exception');
  if (process.env.NODE_ENV === 'development') {
    console.error(error.message);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection');
  if (process.env.NODE_ENV === 'development' && reason instanceof Error) {
    console.error(reason.message);
  }
  process.exit(1);
});

module.exports = app;

