import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { globalLimiter } from './middlewares/rateLimiters';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import listingRoutes from './routes/listings';
import bookingRoutes from './routes/bookings';
import reviewRoutes from './routes/reviews';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payments';
import conversationRoutes from './routes/conversations';
import notificationRoutes from './routes/notifications';
import articleRoutes from './routes/articles';
import reportRoutes from './routes/reports';
import wishlistRoutes from './routes/wishlist';
import payoutRoutes from './routes/payouts';
import errorHandler from './middlewares/errorHandler';

dotenv.config();

const app = express();

const getRequiredEnvVars = (): string[] => {
  const required: string[] = ['JWT_SECRET'];
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    required.push('MONGODB_URI');
  }

  if (process.env.NODE_ENV === 'production') {
    required.push('PAYMENT_PROVIDER');
  }

  const paymentProvider = (process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();
  if (paymentProvider === 'stripe') {
    required.push('STRIPE_SECRET_KEY');
  }
  return required;
};

const getJwtSecret = (): string => {
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

const allowedOrigins = [
  'http://localhost:8080',
  'https://gaaubasti-19rzg9sr5-aryalkiran01s-projects.vercel.app',
  'https://gaaubasti.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());

app.use('/api/', globalLimiter);

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payouts', payoutRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Gaunbasti API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
let server: any;

const initializeSocketIO = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  (global as any).io = io;

  io.use((socket: any, next: any) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      socket.user = { _id: decoded.userId };
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: any) => {
    socket.on('joinConversation', (conversationId: string) => {
      if (conversationId) {
        socket.join(String(conversationId));
      }
    });

    socket.on('typing:start', (payload: any) => {
      if (payload?.conversationId) {
        socket.to(payload.conversationId).emit('typing:start', {
          userId: socket.user?._id,
          conversationId: payload.conversationId
        });
      }
    });

    socket.on('typing:stop', (payload: any) => {
      if (payload?.conversationId) {
        socket.to(payload.conversationId).emit('typing:stop', {
          userId: socket.user?._id,
          conversationId: payload.conversationId
        });
      }
    });
  });
};

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

    initializeSocketIO(server);
  } catch {
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

process.on('uncaughtException', (error: Error) => {
  console.error('Unhandled exception');
  if (process.env.NODE_ENV === 'development') {
    console.error(error.message);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled promise rejection');
  if (process.env.NODE_ENV === 'development' && reason instanceof Error) {
    console.error(reason.message);
  }
  process.exit(1);
});

export default app;
