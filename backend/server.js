import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import leaderboardRoutes from './routes/leaderboard.js';
import notificationRoutes from './routes/notifications.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// SECURITY & REQUEST MIDDLEWARES
// ==========================================

// HTTP Security headers
app.use(helmet());

// CORS config
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: clientUrl,
  credentials: true
}));

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
app.use(morgan('dev'));

// Rate Limiter to prevent brute force/ddos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', limiter);

// ==========================================
// ROUTES REGISTER
// ==========================================

// API health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Main routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Fallback for non-existent routes
app.use('*', (req, res, next) => {
  res.status(404).json({ error: `Route ${req.baseUrl} not found.` });
});

// Central error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` CivicAI REST API Server Running in [${process.env.NODE_ENV || 'development'}] mode`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Connected Client Allowed: ${clientUrl}`);
  console.log(`=================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[CRITICAL] Port ${PORT} is already in use.`);
    console.error(`Please free the port or specify a different PORT in your .env file.\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

export default app;
