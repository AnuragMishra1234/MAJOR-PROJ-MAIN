/**
 * backend/src/index.js
 *
 * Entry point for the "Generative AI for Everyone" backend.
 *
 * Architecture:
 *   Express server
 *     ├── /api/health         — Public health check
 *     ├── /api/auth           — Register, login, user profile
 *     └── /api/projects       — Project CRUD + AI/execution hooks
 *
 * Protected routes require JWT (Bearer token in Authorization header).
 *
 * Agent and AI modules are NOT wired in this phase.
 * Extension point for future integration is documented below.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import agentRoutes from './routes/agentRoutes.js';

// ─── 1. Load Environment Variables ───────────────────────────────────────────
dotenv.config({ override: true });

// ─── 2. Connect to MongoDB ────────────────────────────────────────────────────
await connectDB();

// ─── 3. Initialize Express ───────────────────────────────────────────────────
const app = express();

// ─── 4. CORS Configuration ───────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:5173', // Vite default dev port
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} is not allowed.`), false);
    },
    credentials: true,
  })
);

// ─── 5. Body Parsers ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parse error → clean 400 (not a 500)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' });
  }
  next(err);
});

// ─── 6. Request Logger (development only) ────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── 7. Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }[dbState] || 'unknown';

  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'GenAI for Everyone backend is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
  });
});

// ─── 8. API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);


app.use('/api/agent', agentRoutes);

// ─── 9. 404 + Global Error Handler ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── 10. Start Server ────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, () => {
  console.log('==========================================');
  console.log(`🚀 GenAI Backend running on port ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth:   http://localhost:${PORT}/api/auth`);
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects`);
  console.log('==========================================');
});
