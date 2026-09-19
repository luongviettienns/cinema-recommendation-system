import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

export const app = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'CineLight API Server',
    version: '1.0.0',
  });
});

// Root API v1 info
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'CineLight API v1 is operational',
    endpoints: {
      auth: '/api/v1/auth',
      movies: '/api/v1/movies',
      cinemas: '/api/v1/cinemas',
      showtimes: '/api/v1/showtimes',
      bookings: '/api/v1/bookings',
      payments: '/api/v1/payments',
      tickets: '/api/v1/tickets',
      admin: '/api/v1/admin',
    },
  });
});

import { authRoutes } from './routes/authRoutes';
import { movieRoutes } from './routes/movieRoutes';
import { cinemaRoutes } from './routes/cinemaRoutes';
import showtimeRoutes from './routes/showtimeRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import ticketRoutes from './routes/ticketRoutes';
import staffRoutes from './routes/staffRoutes';
import adminRoutes from './routes/adminRoutes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/movies', movieRoutes);
app.use('/api/v1/cinemas', cinemaRoutes);
app.use('/api/v1/showtimes', showtimeRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi hệ thống máy chủ';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
});
